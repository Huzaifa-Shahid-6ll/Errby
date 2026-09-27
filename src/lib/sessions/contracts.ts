import { z } from "zod";

export const TURN_CHARACTER_LIMIT = 2000;

export type SessionStatus =
  | "ready"
  | "awaiting_student"
  | "evaluating"
  | "supervisor_pending"
  | "errby_ready"
  | "needs_review"
  | "paused"
  | "ended_incomplete"
  | "completed";
export type SessionMessageRole = "student" | "errby" | "supervisor";

// Client projections only: no full objectives, criteria or references.
export type SessionSummary = {
  id: string;
  status: SessionStatus;
  visibility: "private" | "class";
  lesson_title: string;
  objective_labels: string[];
  opened_at: string;
  last_sequence: number;
  objective_progress?: {
    id: string;
    label: string;
    status: "untested" | "developing" | "explained" | "unverified";
  }[];
};
export type SessionMessage = {
  id: string;
  sequence: number;
  role: SessionMessageRole;
  text: string;
  created_at: string;
};
export type SessionState = {
  session: SessionSummary;
  messages: SessionMessage[];
  processing_error?: { code: string; message: string };
};
export type TurnResponse = {
  session: SessionSummary;
  message: SessionMessage;
  messages?: SessionMessage[];
  processing_error?: { code: string; message: string };
};
export type PublishedLesson = {
  lesson_version_id: string;
  title: string;
  objective_labels: string[];
  initial_question: string;
};

export const openSessionSchema = z.strictObject({
  lesson_version_id: z.uuid(),
});
export const submitTurnSchema = z.strictObject({
  text: z.string().trim().min(1).max(TURN_CHARACTER_LIMIT),
  expected_sequence: z.number().int().min(0),
  idempotency_key: z.uuid(),
});
