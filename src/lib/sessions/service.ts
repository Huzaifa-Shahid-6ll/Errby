import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IngestionError } from "@/lib/ingestion/server";
import {
  openSessionSchema,
  submitTurnSchema,
  type PublishedLesson,
  type SessionMessage,
  type SessionState,
  type SessionSummary,
  type TurnResponse,
} from "./contracts";

export const uuid = z.uuid();
export type SessionActor = { id: string; role: "learner" | "teacher" };

type RawSession = {
  id: string;
  status: SessionSummary["status"];
  visibility: "private" | "class";
  class_id: string | null;
  lesson_version_id: string;
  last_sequence: number;
  opened_at: string;
};
type RawMessage = {
  id: string;
  sequence: number;
  role: SessionMessage["role"];
  text: string;
  turn_id?: string;
  created_at: string;
};

const failures: Record<string, [number, string]> = {
  session_learner_required: [
    403,
    "Learning sessions are learner activities. Sign in with your learner account.",
  ],
  lesson_unavailable: [404, "This lesson is not available for a session."],
  membership_required: [403, "This session is unavailable for your account."],
  private_lesson_denied: [403, "This session is unavailable for your account."],
  session_not_found: [404, "This session is unavailable for your account."],
  session_forbidden: [404, "This session is unavailable for your account."],
  invalid_turn: [400, "Enter 1–2000 characters for your explanation."],
  session_not_awaiting: [
    409,
    "This session is not waiting for a new answer. Reload the saved session.",
  ],
  sequence_conflict: [
    409,
    "The session moved on. Reload it; your answer was not saved twice.",
  ],
  turn_conflict: [
    409,
    "This retry key belongs to different text. Reload the saved session.",
  ],
};

export function sessionFailure(error: { message: string }): never {
  const code = Object.keys(failures).find((key) => error.message.includes(key));
  if (code)
    throw new IngestionError(code, failures[code][1], failures[code][0]);
  throw new IngestionError(
    "session_storage_unavailable",
    "Saved sessions are unavailable. Check the hosted Supabase configuration and apply all repository migrations; then retry. No evaluation was made.",
    503,
  );
}

function objectiveLabels(objectives: unknown): string[] {
  if (!Array.isArray(objectives)) return [];
  return objectives
    .map((objective) =>
      objective &&
      typeof objective === "object" &&
      "title" in objective &&
      typeof objective.title === "string"
        ? objective.title
        : null,
    )
    .filter((title): title is string => title !== null);
}

// Lesson context for summaries: title and objective labels only. Objectives,
// criteria, references and corrections never reach the session client.
async function lessonContext(
  db: SupabaseClient,
  lessonVersionId: string,
): Promise<{ title: string; objective_labels: string[] }> {
  const { data, error } = await db
    .from("lesson_versions")
    .select("objectives_json,lessons!inner(title)")
    .eq("id", lessonVersionId)
    .maybeSingle();
  if (error) sessionFailure(error);
  if (!data) throw sessionFailure({ message: "session_not_found" });
  return {
    title: (data.lessons as unknown as { title: string }).title,
    objective_labels: objectiveLabels(data.objectives_json),
  };
}

async function summary(db: SupabaseClient, raw: RawSession) {
  const context = await lessonContext(db, raw.lesson_version_id);
  const summary: SessionSummary = {
    id: raw.id,
    status: raw.status,
    visibility: raw.visibility,
    lesson_title: context.title,
    objective_labels: context.objective_labels,
    opened_at: raw.opened_at,
    last_sequence: raw.last_sequence,
  };
  return summary;
}

export async function openSession(
  db: SupabaseClient,
  actor: SessionActor,
  input: unknown,
): Promise<SessionState> {
  if (actor.role !== "learner")
    throw new IngestionError(
      "session_learner_required",
      failures.session_learner_required[1],
      403,
    );
  const parsed = openSessionSchema.safeParse(input);
  if (!parsed.success)
    throw new IngestionError(
      "invalid_request",
      "Choose a published lesson version to start the session.",
      400,
    );
  const { data, error } = await db.rpc("open_learning_session", {
    p_learner: actor.id,
    p_lesson_version_id: parsed.data.lesson_version_id,
  });
  if (error) sessionFailure(error);
  const result = data as { session: RawSession; message: RawMessage };
  return {
    session: await summary(db, result.session),
    messages: [
      {
        id: result.message.id,
        sequence: result.message.sequence,
        role: result.message.role,
        text: result.message.text,
        created_at: result.message.created_at,
      },
    ],
  };
}

export async function getSession(
  db: SupabaseClient,
  actor: SessionActor,
  id: string,
): Promise<SessionState> {
  if (!uuid.safeParse(id).success)
    throw new IngestionError(
      "invalid_id",
      "Use a valid saved session link.",
      400,
    );
  const { data, error } = await db
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("learner_id", actor.id)
    .maybeSingle();
  if (error) sessionFailure(error);
  if (!data) throw sessionFailure({ message: "session_not_found" });
  const raw = data as RawSession;
  const messages = await db
    .from("messages")
    .select("id,sequence,role,text,created_at")
    .eq("session_id", id)
    .order("sequence", { ascending: true });
  if (messages.error) sessionFailure(messages.error);
  return {
    session: await summary(db, raw),
    messages: (messages.data ?? []) as SessionMessage[],
  };
}

export async function submitTurn(
  db: SupabaseClient,
  actor: SessionActor,
  id: string,
  input: unknown,
): Promise<TurnResponse> {
  const parsed = submitTurnSchema.safeParse(input);
  if (!parsed.success)
    throw new IngestionError("invalid_turn", failures.invalid_turn[1], 400);
  const { data, error } = await db.rpc("record_student_turn", {
    p_learner: actor.id,
    p_session_id: id,
    p_turn_id: parsed.data.idempotency_key,
    p_text: parsed.data.text,
    p_expected_sequence: parsed.data.expected_sequence,
  });
  if (error) sessionFailure(error);
  const result = data as { session: RawSession; message: RawMessage };
  return {
    session: await summary(db, result.session),
    message: {
      id: result.message.id,
      sequence: result.message.sequence,
      role: result.message.role,
      text: result.message.text,
      created_at: result.message.created_at,
    },
  };
}

// Learner-facing published lesson list. Runs on the caller's session client so
// RLS scopes it: owned private lessons or current published versions of active
// classes the learner belongs to.
export async function listPublishedLessons(
  db: SupabaseClient,
): Promise<PublishedLesson[]> {
  const lessons = await db
    .from("lessons")
    .select("id,title,archived_at,current_published_version")
    .limit(50);
  if (lessons.error) sessionFailure(lessons.error);
  const rows = (lessons.data ?? []) as {
    id: string;
    title: string;
    archived_at: string | null;
    current_published_version: string | null;
  }[];
  if (!rows.length) return [];
  const versions = await db
    .from("lesson_versions")
    .select("id,lesson_id,initial_question,objectives_json")
    .in(
      "lesson_id",
      rows.map((row) => row.id),
    );
  if (versions.error) sessionFailure(versions.error);
  const byId = new Map(
    (
      (versions.data ?? []) as {
        id: string;
        lesson_id: string;
        initial_question: string;
        objectives_json: unknown;
      }[]
    ).map((version) => [version.id, version]),
  );
  return rows
    .filter(
      (row) =>
        row.archived_at === null &&
        row.current_published_version !== null &&
        byId.has(row.current_published_version),
    )
    .map((row) => {
      const version = byId.get(row.current_published_version!)!;
      return {
        lesson_version_id: version.id,
        title: row.title,
        objective_labels: objectiveLabels(version.objectives_json),
        initial_question: version.initial_question,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 50);
}
