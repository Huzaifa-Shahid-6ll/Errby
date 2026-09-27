import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lessonSchema } from "@/lib/lessons/schema";
import { evaluateAnswer, EVALUATION_PROMPT_VERSION } from "@/lib/ai/evaluate";
import { generateReply } from "@/lib/ai/reply";
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
  providers = { evaluateAnswer, generateReply },
) {
  await assertSessionAccess(db, actor, id);
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
    const evaluated = await providers.evaluateAnswer({
      db,
      ownerId: actor.id,
      messageId: answer.id,
      lesson,
      learnerAnswer: answer.text,
      conversation: state.messages.slice(0, -1),
      precedingCorrection,
    });
    const history = await db
      .from("messages")
      .select("misconception_id,role")
      .eq("session_id", id)
      .order("sequence", { ascending: true });
    const interventions = await db
      .from("interventions")
      .select("misconception_id")
      .eq("session_id", id)
      .eq("resolved", false);
    const progress = await db
      .from("objective_progress")
      .select("objective_id,state")
      .eq("session_id", id);
    for (const result of [history, interventions, progress])
      if (result.error) sessionFailure(result.error);
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
    });
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
        code:
          error instanceof IngestionError
            ? error.code
            : "processing_unavailable",
        message:
          error instanceof IngestionError
            ? error.message
            : "Your answer is saved. Retry the saved turn when processing is available.",
      },
    };
  }
}
