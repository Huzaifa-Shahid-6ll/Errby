import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { assertSessionAccess } from "@/lib/sessions/service";
import {
  summarizeEvidence,
  type Attempt,
  type Goal,
  type Progress,
} from "./metrics";

const uuid = z.uuid();
const fail = (): never => {
  throw new Error("Results are unavailable for this account or lesson.");
};

async function pages<T>(
  query: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 500) {
    const result = await query(from, from + 499);
    if (result.error) fail();
    rows.push(...(result.data ?? []));
    if ((result.data?.length ?? 0) < 500) return rows;
  }
}

type SessionRow = {
  id: string;
  learner_id: string;
  class_id: string | null;
  lesson_version_id: string;
  visibility: string;
  status: string;
  active_ms: number;
  opened_at: string;
};
type Result = Omit<ReturnType<typeof summarizeEvidence>, "goals"> & {
  goals: {
    id: string;
    title: string;
    state: string;
    evidence: string | null;
    uncertainty: string | null;
  }[];
  reviews: {
    id: string;
    objective_id: string;
    verdict: Attempt["verdict"];
    original_verdict: Attempt["verdict"];
    learner_evidence_span: string;
    uncertainty_reason: string | null;
    source_refs: string[];
    answer: string;
    revised: boolean;
    revision_reasons: string[];
  }[];
  revised: boolean;
  session_id: string;
  status: string;
  active_ms: number | null;
  opened_at: string;
  last_attempt_at: string | null;
  lesson_title: string;
  learner_id: string;
};

async function summarizeSessions(
  db: SupabaseClient,
  sessions: SessionRow[],
  lessonTitle: string,
  goals: Goal[],
): Promise<Result[]> {
  if (!sessions.length) return [];
  if (sessions.length > 100) {
    const batches: Result[] = [];
    for (let at = 0; at < sessions.length; at += 100)
      batches.push(
        ...(await summarizeSessions(
          db,
          sessions.slice(at, at + 100),
          lessonTitle,
          goals,
        )),
      );
    return batches;
  }
  const ids = sessions.map((session) => session.id);
  const [progress, evaluations, interventions] = await Promise.all([
    pages<Progress & { session_id: string }>((from, to) =>
      db
        .from("objective_progress")
        .select("session_id,objective_id,state")
        .in("session_id", ids)
        .range(from, to),
    ),
    pages<
      Omit<Attempt, "sequence"> & {
        id: string;
        session_id: string;
        message_id: string;
        learner_evidence_span: string;
        uncertainty_reason: string | null;
        source_refs: string[];
      }
    >((from, to) =>
      db
        .from("evaluations")
        .select(
          "id,session_id,message_id,objective_id,verdict,assisted,independent,learner_evidence_span,uncertainty_reason,source_refs",
        )
        .in("session_id", ids)
        .range(from, to),
    ),
    pages<{
      session_id: string;
      objective_id: string | null;
      misconception_id: string | null;
      resolved: boolean;
    }>((from, to) =>
      db
        .from("interventions")
        .select("session_id,objective_id,misconception_id,resolved")
        .in("session_id", ids)
        .range(from, to),
    ),
  ]);
  const messageIds = evaluations.map((item) => item.message_id);
  const revisions: {
    evaluation_id: string;
    new_verdict: Attempt["verdict"];
    reason: string;
  }[] = [];
  for (let at = 0; at < evaluations.length; at += 100)
    revisions.push(
      ...(await pages<{
        evaluation_id: string;
        new_verdict: Attempt["verdict"];
        reason: string;
      }>((from, to) =>
        db
          .from("assessment_revisions")
          .select("evaluation_id,new_verdict,reason")
          .in(
            "evaluation_id",
            evaluations.slice(at, at + 100).map((item) => item.id),
          )
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to),
      )),
    );
  const revisedVerdicts = new Map(
    revisions.map((item) => [item.evaluation_id, item.new_verdict]),
  );
  const messages: {
    id: string;
    sequence: number;
    text: string;
    created_at: string;
  }[] = [];
  for (let at = 0; at < messageIds.length; at += 100)
    messages.push(
      ...(await pages<{
        id: string;
        sequence: number;
        text: string;
        created_at: string;
      }>((from, to) =>
        db
          .from("messages")
          .select("id,sequence,text,created_at")
          .in("id", messageIds.slice(at, at + 100))
          .range(from, to),
      )),
    );
  const sequences = new Map(
    messages.map((message) => [message.id, message.sequence]),
  );
  const unresolved = new Set(
    interventions
      .filter((item) => !item.resolved)
      .map((item) => item.session_id),
  );
  return sessions.map((session) => {
    const sessionEvaluations = evaluations
      .filter((item) => item.session_id === session.id)
      .map((item) => ({
        ...item,
        original_verdict: item.verdict,
        verdict: revisedVerdicts.get(item.id) ?? item.verdict,
        revised: revisedVerdicts.has(item.id),
        revision_reasons: revisions
          .filter((revision) => revision.evaluation_id === item.id)
          .map((revision) => revision.reason),
        answer:
          messages.find((message) => message.id === item.message_id)?.text ??
          "",
      }));
    const summary = summarizeEvidence(
      goals,
      progress.filter((item) => item.session_id === session.id),
      sessionEvaluations.map((item) => ({
        ...item,
        sequence: sequences.get(item.message_id) ?? Number.MAX_SAFE_INTEGER,
      })),
      unresolved.has(session.id),
      session.status,
      interventions.filter((item) => item.session_id === session.id),
    );
    return {
      ...summary,
      revised: sessionEvaluations.some((item) => item.revised),
      reviews: sessionEvaluations,
      goals: summary.goals.map((goal) => ({
        ...goal,
        evidence:
          sessionEvaluations
            .filter((item) => item.objective_id === goal.id)
            .sort(
              (a, b) =>
                (sequences.get(b.message_id) ?? 0) -
                (sequences.get(a.message_id) ?? 0),
            )[0]?.learner_evidence_span ?? null,
        uncertainty:
          sessionEvaluations
            .filter(
              (item) =>
                item.objective_id === goal.id && item.verdict === "unverified",
            )
            .map(
              (item) =>
                item.uncertainty_reason ?? "Source evidence needs review.",
            )
            .join(" ") || null,
      })),
      session_id: session.id,
      status: session.status,
      active_ms: session.active_ms > 0 ? session.active_ms : null,
      opened_at: session.opened_at,
      last_attempt_at:
        messages
          .filter((message) =>
            sessionEvaluations.some(
              (evaluation) => evaluation.message_id === message.id,
            ),
          )
          .sort((a, b) => b.sequence - a.sequence)[0]?.created_at ?? null,
      lesson_title: lessonTitle,
      learner_id: session.learner_id,
    };
  });
}

async function lesson(db: SupabaseClient, versionId: string) {
  const { data, error } = await db
    .from("lesson_versions")
    .select(
      "objectives_json,reference_json,lessons!lesson_versions_lesson_id_fkey!inner(title,class_id)",
    )
    .eq("id", versionId)
    .single();
  if (error || !data) fail();
  const goals = z
    .array(
      z.object({ id: z.string(), title: z.string(), required: z.boolean() }),
    )
    .safeParse(data!.objectives_json);
  if (!goals.success) fail();
  return {
    title: (data!.lessons as unknown as { title: string }).title,
    class_id: (data!.lessons as unknown as { class_id: string | null })
      .class_id,
    goals: goals.data!,
    references: z
      .array(z.object({ id: z.string(), text: z.string(), status: z.string() }))
      .parse(data!.reference_json),
  };
}

export async function learnerResult(
  db: SupabaseClient,
  learnerId: string,
  sessionId: string,
) {
  if (!uuid.safeParse(sessionId).success) fail();
  await assertSessionAccess(db, { id: learnerId, role: "learner" }, sessionId);
  const { data, error } = await db
    .from("sessions")
    .select(
      "id,learner_id,class_id,lesson_version_id,visibility,status,active_ms,opened_at",
    )
    .eq("id", sessionId)
    .eq("learner_id", learnerId)
    .maybeSingle();
  if (error || !data) fail();
  const session = data!;
  const context = await lesson(db, session.lesson_version_id);
  return (
    await summarizeSessions(db, [session], context.title, context.goals)
  )[0];
}

export async function classResults(
  db: SupabaseClient,
  teacherId: string,
  classId: string,
  versionId: string,
) {
  if (!uuid.safeParse(classId).success || !uuid.safeParse(versionId).success)
    fail();
  const owner = await db
    .from("classes")
    .select("id,title")
    .eq("id", classId)
    .eq("teacher_id", teacherId)
    .eq("active", true)
    .maybeSingle();
  if (owner.error || !owner.data) fail();
  const context = await lesson(db, versionId);
  if (context.class_id !== classId) fail();
  const roster = await pages<{ student_id: string; alias_in_class: string }>(
    (from, to) =>
      db
        .from("memberships")
        .select("student_id,alias_in_class")
        .eq("class_id", classId)
        .eq("status", "active")
        .range(from, to),
  );
  const sessions = await pages<SessionRow>((from, to) =>
    db
      .from("sessions")
      .select(
        "id,learner_id,class_id,lesson_version_id,visibility,status,active_ms,opened_at",
      )
      .eq("class_id", classId)
      .eq("lesson_version_id", versionId)
      .eq("visibility", "class")
      .order("opened_at", { ascending: false })
      .range(from, to),
  );
  const results = await summarizeSessions(
    db,
    sessions,
    context.title,
    context.goals,
  );
  const latest = new Map<string, Result>();
  for (const result of results)
    if (!latest.has(result.learner_id)) latest.set(result.learner_id, result);
  const empty = summarizeEvidence(context.goals, [], [], false, "ready");
  const eligible = roster
    .map((member) => latest.get(member.student_id))
    .filter((result): result is Result => !!result && result.scorable > 0);
  return {
    participants: eligible.length,
    average: eligible.length
      ? Math.round(
          (100 *
            eligible.reduce(
              (total, result) => total + result.correct / result.scorable,
              0,
            )) /
            eligible.length,
        )
      : null,
    class_title: owner.data!.title,
    lesson_title: context.title,
    references: context.references,
    roster: roster.map((member) => ({
      alias: member.alias_in_class,
      result: latest.get(member.student_id) ?? {
        ...empty,
        goals: empty.goals.map((goal) => ({
          ...goal,
          evidence: null,
          uncertainty: null,
        })),
        reviews: [],
        revised: false,
        active_ms: null,
        opened_at: null,
        last_attempt_at: null,
        session_id: null,
        status: "not_started",
      },
    })),
  };
}
