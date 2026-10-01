import "server-only";
import { z } from "zod";
import type { Lesson } from "@/lib/lessons/schema";

const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
const text = z.string().trim().min(1).max(2000);

export const evaluationDecisionSchema = z.strictObject({
  assessments: z
    .array(
      z.strictObject({
        objective_id: id,
        verdict: z.enum([
          "correct",
          "partial",
          "incorrect",
          "unverified",
          "off_topic",
        ]),
        learner_quote: z.string().max(500),
        reason: z.string().trim().min(1).max(500),
        reference_ids: z.array(id).max(20),
        assisted: z.boolean(),
        independent: z.boolean(),
        uncertainty_reason: z.string().trim().min(1).max(500).nullable(),
      }),
    )
    .min(1)
    .max(5),
  supervisor: z.discriminatedUnion("trigger", [
    z.strictObject({ trigger: z.literal("none") }),
    z.strictObject({
      trigger: z.enum(["correction", "uncertainty"]),
      text,
      reference_ids: z.array(id).max(20),
    }),
  ]),
});

export type EvaluationDecision = z.infer<typeof evaluationDecisionSchema>;

export function isCopiedCorrection(answer: string, correction?: string) {
  const normalize = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[.!?]+$/, "");
  const explanation = normalize(answer);
  // ponytail: catches literal excerpts, not paraphrases; semantic independence
  // still belongs to the evaluator and its changed-example check.
  return Boolean(
    explanation && correction && normalize(correction).includes(explanation),
  );
}

// The lesson and answer must come from server-owned, version-pinned records.
// This checks model output before any evaluation, message or progress write.
export function validateEvaluationDecision(
  output: unknown,
  lesson: Lesson,
  learnerAnswer: string,
  precedingCorrection?: string,
): EvaluationDecision {
  const decision = evaluationDecisionSchema.parse(output);
  const objectives = new Map(lesson.objectives.map((item) => [item.id, item]));
  const references = new Map(lesson.references.map((item) => [item.id, item]));
  const seen = new Set<string>();
  let correction = false;
  let uncertainty = false;
  const copied = isCopiedCorrection(learnerAnswer, precedingCorrection);

  for (const assessment of decision.assessments) {
    const objective = objectives.get(assessment.objective_id);
    if (!objective || seen.has(assessment.objective_id))
      throw new Error("Invalid or duplicate objective ID");
    seen.add(assessment.objective_id);
    if (
      assessment.learner_quote &&
      !learnerAnswer.includes(assessment.learner_quote)
    )
      throw new Error("Learner quote is absent from submitted answer");
    if (copied && assessment.independent)
      throw new Error("Copied correction is not independent evidence");
    if (assessment.verdict === "incorrect") correction = true;
    if (assessment.verdict === "unverified") uncertainty = true;
    if (
      (assessment.verdict === "unverified") !==
      (assessment.uncertainty_reason !== null)
    )
      throw new Error("Uncertainty reason does not match verdict");
    if (assessment.verdict === "correct" && !assessment.learner_quote)
      throw new Error("Correct verdict requires a learner quote");
    if (
      new Set(assessment.reference_ids).size !== assessment.reference_ids.length
    )
      throw new Error("Duplicate assessment reference");
    for (const referenceId of assessment.reference_ids) {
      const reference = references.get(referenceId);
      if (
        !objective.reference_ids.includes(referenceId) ||
        !reference ||
        reference.purpose !== "evidence"
      )
        throw new Error("Reference is not evidence for this objective");
      if (
        reference.status !== "source_checked" &&
        assessment.verdict !== "unverified"
      )
        throw new Error(
          "Unchecked or conflicting reference requires an unverified verdict",
        );
    }
    if (
      !assessment.reference_ids.length &&
      assessment.verdict !== "unverified" &&
      assessment.verdict !== "off_topic"
    )
      throw new Error("Absent source evidence requires an unverified verdict");
  }

  const expectedTrigger = correction
    ? "correction"
    : uncertainty
      ? "uncertainty"
      : "none";
  if (decision.supervisor.trigger !== expectedTrigger)
    throw new Error("Supervisor trigger does not match assessments");
  if (decision.supervisor.trigger !== "none") {
    if (
      new Set(decision.supervisor.reference_ids).size !==
      decision.supervisor.reference_ids.length
    )
      throw new Error("Duplicate supervisor reference");
    for (const referenceId of decision.supervisor.reference_ids) {
      const reference = references.get(referenceId);
      if (
        !reference ||
        reference.purpose !== "evidence" ||
        reference.status !== "source_checked"
      )
        throw new Error("Supervisor citation is not source checked");
      if (
        !decision.assessments.some((assessment) =>
          assessment.reference_ids.includes(referenceId),
        )
      )
        throw new Error("Supervisor citation is unrelated to the assessment");
    }
    if (
      decision.supervisor.trigger === "correction" &&
      !decision.supervisor.reference_ids.length
    )
      throw new Error("Correction needs a checked source citation");
  }
  return decision;
}
