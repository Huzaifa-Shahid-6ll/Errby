import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lessonSchema } from "@/lib/lessons/schema";
import { evaluateAnswer, EVALUATION_PROMPT_VERSION } from "@/lib/ai/evaluate";
import { generateReply } from "@/lib/ai/reply";
import { generateVisualReply } from "@/lib/visuals/server";
import type { NextTurn } from "@/lib/ai/next-turn";
import { IngestionError } from "@/lib/ingestion/server";
import {
  assertSessionAccess,
  getSession,
  sessionFailure,
  type SessionActor,
} from "./service";

export async function processSession(
  db: SupabaseClient,
  actor: SessionActor,
  id: string,
  providers: {
    evaluateAnswer: typeof evaluateAnswer;
    generateReply: typeof generateReply;
    generateVisualReply?: typeof generateVisualReply;
  } = { evaluateAnswer, generateReply, generateVisualReply },
  signal?: AbortSignal,
) {
  await assertSessionAccess(db, actor, id);
  signal?.throwIfAborted();
  const claim = await db.rpc("claim_learning_turn", {
    p_learner: actor.id,
    p_session_id: id,
  });
  if (claim.error) sessionFailure(claim.error);
  if (!claim.data) return getSession(db, actor, id);
  const { token, lesson_version_id } = claim.data as {
    token: string;
    lesson_version_id: string;
  };
  try {
    signal?.throwIfAborted();
    const state = await getSession(db, actor, id);
    const answer = state.messages.at(-1);
    if (!answer || answer.role !== "student")
      throw new Error("Missing saved learner turn");
    const version = await db
      .from("lesson_versions")
      .select("lesson_json,review_status")
      .eq("id", lesson_version_id)
      .single();
    if (version.error) sessionFailure(version.error);
    const lesson = lessonSchema.parse(version.data.lesson_json);
    const precedingCorrection = state.messages.findLast(
      (message) => message.role === "supervisor",
    )?.text;
    const currentVisual = state.messages.findLast(
      (message) =>
        message.visual &&
        (!answer.visual_context ||
          message.visual.id === answer.visual_context.id),
    )?.visual;
    // ponytail: retain eight distinct supplied snapshots in the model context;
    // immediate assistance remains an application/SQL guard, not a model guess.
    const visualSnapshots = [
      ...new Map(
        state.messages.flatMap((message) =>
          [message.visual_context, message.visual]
            .filter((value) => value !== undefined)
            .map((value) => [JSON.stringify(value), value] as const),
        ),
      ).values(),
    ].slice(-8);
    if (answer.visual_request) {
      const generated = await (
        providers.generateVisualReply ?? generateVisualReply
      )({
        db,
        ownerId: actor.id,
        requestKey: `${answer.id}:visual`,
        message: answer.text,
        current_visual: currentVisual,
        context: {
          question: state.messages.at(-2)?.text,
          references: lesson.references.filter(
            (reference) =>
              reference.status === "source_checked" &&
              reference.purpose === "evidence",
          ),
        },
        signal,
      });
      signal?.throwIfAborted();
      const reply: NextTurn = {
        kind: "reply",
        role: "errby",
        text: generated.text,
        misconception_id: null,
        unresolved_misconception_id: null,
        reference_ids: [],
        ...(generated.visual ? { visual: generated.visual } : {}),
      };
      const finished = await db.rpc("finish_learning_turn", {
        p_learner: actor.id,
        p_session_id: id,
        p_token: token,
        p_message_id: answer.id,
        p_assessments: [],
        p_rubric_version: EVALUATION_PROMPT_VERSION,
        p_model_id: "visual-help-ungraded",
        p_reply: reply,
      });
      if (finished.error) sessionFailure(finished.error);
      return getSession(db, actor, id);
    }
    const evaluated = await providers.evaluateAnswer({
      db,
      signal,
      ownerId: actor.id,
      messageId: answer.id,
      lesson,
      learnerAnswer: answer.text,
      conversation: state.messages.slice(0, -1),
      precedingCorrection,
      visualAssistance: visualSnapshots,
      visualAssisted: Boolean(
        answer.visual_context || state.messages.at(-2)?.visual_assistance,
      ),
    });
    signal?.throwIfAborted();
    const [history, interventions, progress, evaluations] = await Promise.all([
      db
        .from("messages")
        .select("misconception_id,role")
        .eq("session_id", id)
        .order("sequence", { ascending: true }),
      db
        .from("interventions")
        .select("misconception_id")
        .eq("session_id", id)
        .eq("resolved", false),
      db
        .from("objective_progress")
        .select("objective_id,state")
        .eq("session_id", id),
      db
        .from("evaluations")
        .select("objective_id,verdict,independent,assisted")
        .eq("session_id", id),
    ]);
    for (const result of [history, interventions, progress, evaluations])
      if (result.error) sessionFailure(result.error);
    const unsuccessfulAttempts: Record<string, number> = {};
    for (const assessment of [
      ...(evaluations.data ?? []),
      ...evaluated.decision.assessments,
    ]) {
      if (
        assessment.verdict !== "correct" ||
        !assessment.independent ||
        assessment.assisted
      )
        unsuccessfulAttempts[assessment.objective_id] =
          (unsuccessfulAttempts[assessment.objective_id] ?? 0) + 1;
    }
    const explained = new Set<string>(
      (progress.data ?? [])
        .filter((p) => p.state === "explained")
        .map((p) => p.objective_id),
    );
    for (const assessment of evaluated.decision.assessments) {
      if (
        assessment.verdict === "correct" &&
        assessment.independent &&
        !assessment.assisted
      )
        explained.add(assessment.objective_id);
      else explained.delete(assessment.objective_id);
    }
    const reply = await providers.generateReply({
      db,
      signal,
      ownerId: actor.id,
      messageId: answer.id,
      lesson,
      learner_answer: answer.text,
      decision: evaluated.decision,
      preceding_correction: precedingCorrection,
      privatePractice:
        version.data.review_status === "private_ready" &&
        state.session.visibility === "private",
      used_misconception_ids: (history.data ?? [])
        .map((m) => m.misconception_id)
        .filter(Boolean),
      unresolved_misconception_id:
        interventions.data?.find((i) => i.misconception_id)?.misconception_id ??
        history.data?.at(-2)?.misconception_id ??
        undefined,
      remaining_objective_ids: lesson.objectives
        .filter((o) => !explained.has(o.id))
        .map((o) => o.id),
      unsuccessful_attempts: unsuccessfulAttempts,
      current_visual: answer.visual_context ? currentVisual : undefined,
    });
    signal?.throwIfAborted();
    // Never cancel an atomic evidence commit in flight; reload decides its outcome.
    const finished = await db.rpc("finish_learning_turn", {
      p_learner: actor.id,
      p_session_id: id,
      p_token: token,
      p_message_id: answer.id,
      p_assessments: evaluated.decision.assessments,
      p_rubric_version: EVALUATION_PROMPT_VERSION,
      p_model_id: evaluated.model,
      p_reply: reply,
    });
    if (finished.error) sessionFailure(finished.error);
    return await getSession(db, actor, id);
  } catch (error) {
    await db.rpc("release_learning_turn", {
      p_learner: actor.id,
      p_session_id: id,
      p_token: token,
    });
    // Re-read through current access: revocation must not leak a saved transcript.
    const state = await getSession(db, actor, id);
    return {
      ...state,
      processing_error: {
        code: signal?.aborted
          ? "generation_stopped"
          : error instanceof IngestionError
            ? error.code
            : "processing_unavailable",
        message: signal?.aborted
          ? "Processing stopped. Your answer is saved; reload to check its status. Provider charges may still apply, and an interrupted request may need reconciliation before retrying."
          : error instanceof IngestionError
            ? error.message
            : "Your answer is saved. Retry the saved turn when processing is available.",
      },
    };
  }
}
