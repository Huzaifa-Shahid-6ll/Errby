import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
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
  goals: { title: string; state: string; evidence: string | null }[];
  session_id: string;
  status: string;
  active_ms: number | null;
  opened_at: string;
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
        session_id: string;
        message_id: string;
        learner_evidence_span: string;
      }
    >((from, to) =>
      db
        .from("evaluations")
        .select(
          "session_id,message_id,objective_id,verdict,assisted,independent,learner_evidence_span",
        )
        .in("session_id", ids)
        .range(from, to),
    ),
    pages<{ session_id: string }>((from, to) =>
      db
        .from("interventions")
        .select("session_id")
        .in("session_id", ids)
        .eq("resolved", false)
        .range(from, to),
    ),
  ]);
  const messageIds = evaluations.map((item) => item.message_id);
  const messages: { id: string; sequence: number }[] = [];
  for (let at = 0; at < messageIds.length; at += 100)
    messages.push(
      ...(await pages<{ id: string; sequence: number }>((from, to) =>
        db
          .from("messages")
          .select("id,sequence")
          .in("id", messageIds.slice(at, at + 100))
          .range(from, to),
      )),
    );
  const sequences = new Map(
    messages.map((message) => [message.id, message.sequence]),
  );
  const unresolved = new Set(interventions.map((item) => item.session_id));
  return sessions.map((session) => {
    const sessionEvaluations = evaluations.filter(
      (item) => item.session_id === session.id,
    );
    const summary = summarizeEvidence(
      goals,
      progress.filter((item) => item.session_id === session.id),
      sessionEvaluations.map((item) => ({
        ...item,
        sequence: sequences.get(item.message_id) ?? Number.MAX_SAFE_INTEGER,
      })),
      unresolved.has(session.id),
      session.status,
    );
    return {
      ...summary,
      goals: summary.goals.map((goal) => ({
        ...goal,
        evidence:
          sessionEvaluations
            .filter(
              (item) =>
                goals.find((source) => source.id === item.objective_id)
                  ?.title === goal.title,
            )
            .sort(
              (a, b) =>
                (sequences.get(b.message_id) ?? 0) -
                (sequences.get(a.message_id) ?? 0),
            )[0]?.learner_evidence_span ?? null,
      })),
      session_id: session.id,
      status: session.status,
      active_ms: session.active_ms > 0 ? session.active_ms : null,
      opened_at: session.opened_at,
      lesson_title: lessonTitle,
      learner_id: session.learner_id,
    };
  });
}

async function lesson(db: SupabaseClient, versionId: string) {
  const { data, error } = await db
    .from("lesson_versions")
    .select("objectives_json,lessons!inner(title,class_id)")
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
  };
}

export async function learnerResult(
  db: SupabaseClient,
  learnerId: string,
  sessionId: string,
) {
  if (!uuid.safeParse(sessionId).success) fail();
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
  return {
    class_title: owner.data!.title,
    lesson_title: context.title,
    roster: roster.map((member) => ({
      alias: member.alias_in_class,
      result: latest.get(member.student_id) ?? {
        ...empty,
        goals: empty.goals.map((goal) => ({ ...goal, evidence: null })),
        active_ms: null,
        opened_at: null,
        session_id: null,
        status: "not_started",
      },
    })),
  };
}
