import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lesson } from "@/lib/lessons/schema";
import { validateEvaluationDecision } from "@/lib/ai/evaluation";

// Called only after a server-side evaluator returns a decision. No endpoint
// accepts decisions, lesson content or grading metadata from the learner.
export async function recordObjectiveEvidence(
  db: SupabaseClient,
  input: {
    sessionId: string;
    messageId: string;
    lesson: Lesson;
    learnerAnswer: string;
    decision: unknown;
    precedingCorrection?: string;
    rubricVersion: string;
    modelId: string;
  },
) {
  const decision = validateEvaluationDecision(
    input.decision,
    input.lesson,
    input.learnerAnswer,
    input.precedingCorrection,
  );
  const { data, error } = await db.rpc("record_objective_evidence", {
    p_session_id: input.sessionId,
    p_message_id: input.messageId,
    p_assessments: decision.assessments.map((assessment) => ({
      objective_id: assessment.objective_id,
      verdict: assessment.verdict,
      learner_quote: assessment.learner_quote,
      reference_ids: assessment.reference_ids,
      assisted: assessment.assisted,
      independent: assessment.independent,
      uncertainty_reason: assessment.uncertainty_reason,
    })),
    p_rubric_version: input.rubricVersion,
    p_model_id: input.modelId,
  });
  if (error) throw error;
  return data as "completed" | "needs_review";
}
