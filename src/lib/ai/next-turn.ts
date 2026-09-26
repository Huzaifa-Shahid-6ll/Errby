import "server-only";
import type { Lesson } from "@/lib/lessons/schema";
import { validateEvaluationDecision } from "./evaluation";

export type NextTurn =
  | { kind: "needs_review"; reason: string }
  | {
      kind: "reply";
      role: "errby" | "supervisor";
      text: string;
      misconception_id: string | null;
      unresolved_misconception_id: string | null;
      reference_ids: string[];
    };

// Authored lesson text is the only reply source until a paid provider has
// reservations, caps and semantic review. The caller must persist the result
// and state in one transaction before showing it to a learner.
export function selectNextTurn(input: {
  lesson: Lesson;
  learner_answer: string;
  decision: unknown;
  preceding_correction?: string;
  unresolved_misconception_id?: string;
  used_misconception_ids: readonly string[];
}): NextTurn {
  const { lesson, unresolved_misconception_id: unresolved } = input;
  if (
    lesson.illustrative_only ||
    lesson.teacher_review.status !== "approved" ||
    lesson.teacher_review.lesson_version !== lesson.version
  )
    return { kind: "needs_review", reason: "Lesson is not approved" };

  const decision = validateEvaluationDecision(
    input.decision,
    lesson,
    input.learner_answer,
    input.preceding_correction,
  );
  const references = new Map(lesson.references.map((ref) => [ref.id, ref]));
  const checked = (ids: readonly string[]) =>
    ids.length > 0 &&
    ids.every(
      (id) =>
        references.get(id)?.purpose === "evidence" &&
        references.get(id)?.status === "source_checked",
    );
  const active = lesson.objectives
    .flatMap((objective) => objective.misconceptions)
    .find((item) => item.id === unresolved);

  if (unresolved && (!active || !checked(active.reference_ids)))
    return { kind: "needs_review", reason: "Unresolved correction lacks checked evidence" };
  if (decision.supervisor.trigger === "uncertainty")
    return { kind: "needs_review", reason: "Source or assessment is uncertain" };
  if (decision.supervisor.trigger === "correction") {
    if (!active) {
      const wrong = decision.assessments.find((item) => item.verdict === "incorrect");
      const objective = lesson.objectives.find((item) => item.id === wrong?.objective_id);
      if (!objective || !checked(objective.reference_ids) || objective.unresolved_issues.length)
        return { kind: "needs_review", reason: "No checked objective correction matches this answer" };
      return {
        kind: "reply",
        role: "supervisor",
        text: `${objective.correction_criteria.join(" ")} ${objective.application_question}`,
        misconception_id: null,
        unresolved_misconception_id: null,
        reference_ids: objective.reference_ids,
      };
    }
    return {
      kind: "reply",
      role: "supervisor",
      text: `${active.correction} ${active.changed_example_question}`,
      misconception_id: null,
      unresolved_misconception_id: active.id,
      reference_ids: active.reference_ids,
    };
  }
  if (active) {
    const assessment = decision.assessments.find((item) =>
      lesson.objectives.some((objective) =>
        objective.misconceptions.some((item) => item.id === active.id) &&
        objective.id === item.objective_id,
      ),
    );
    return {
      kind: "reply",
      role: "errby",
      text: active.changed_example_question,
      misconception_id: null,
      unresolved_misconception_id:
        assessment?.verdict === "correct" && assessment.independent ? null : active.id,
      reference_ids: active.reference_ids,
    };
  }

  for (const assessment of decision.assessments) {
    const objective = lesson.objectives.find((item) => item.id === assessment.objective_id)!;
    if (!checked(objective.reference_ids) || objective.unresolved_issues.length)
      return { kind: "needs_review", reason: "Objective has unresolved source evidence" };
    if (assessment.verdict === "off_topic" || assessment.verdict === "partial")
      return {
        kind: "reply",
        role: "errby",
        text: objective.follow_up_questions[0],
        misconception_id: null,
        unresolved_misconception_id: null,
        reference_ids: objective.reference_ids,
      };
    const misconception = objective.misconceptions.find(
      (item) =>
        !input.used_misconception_ids.includes(item.id) &&
        checked(item.reference_ids),
    );
    if (misconception)
      return {
        kind: "reply",
        role: "errby",
        text: misconception.question,
        misconception_id: misconception.id,
        unresolved_misconception_id: null,
        reference_ids: misconception.reference_ids,
      };
  }
  return {
    kind: "reply",
    role: "errby",
    text: lesson.application_question,
    misconception_id: null,
    unresolved_misconception_id: null,
    reference_ids: [],
  };
}
