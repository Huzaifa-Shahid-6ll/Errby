import assert from "node:assert/strict";
import { test } from "node:test";
import { exampleLessons } from "../src/lib/lessons/examples";
import { selectNextTurn } from "../src/lib/ai/next-turn";

const draft = exampleLessons[0];
const lesson = {
  ...draft,
  illustrative_only: false,
  teacher_review: {
    status: "approved" as const,
    reviewer_id: "00000000-0000-4000-8000-000000000001",
    reviewed_at: "2026-09-26T00:00:00Z",
    lesson_version: draft.version,
  },
};
const objective = lesson.objectives[0];
const misconception = objective.misconceptions[0];
const answer = "Heat moves from the warmer room into the ice.";
const assessment = {
  objective_id: objective.id,
  verdict: "correct" as const,
  learner_quote: answer,
  reason: "Explains transfer direction",
  reference_ids: [objective.reference_ids[0]],
  assisted: false,
  independent: true,
  uncertainty_reason: null,
};

test("approved, checked misconception is selected once; unresolved error is never repeated", () => {
  const base = {
    lesson,
    learner_answer: answer,
    decision: { assessments: [assessment], supervisor: { trigger: "none" } },
    used_misconception_ids: [] as string[],
  };
  assert.equal(selectNextTurn({ ...base, lesson: draft }).kind, "needs_review");
  const first = selectNextTurn(base);
  assert.equal(first.kind, "reply");
  if (first.kind !== "reply") return;
  assert.equal(first.misconception_id, misconception.id);
  assert.equal(first.text, misconception.question);
  const pending = selectNextTurn({ ...base, unresolved_misconception_id: misconception.id });
  assert.equal(pending.kind, "reply");
  if (pending.kind !== "reply") return;
  assert.equal(pending.misconception_id, null);
  assert.notEqual(pending.text, misconception.question);
  const corrected = selectNextTurn({
    ...base,
    decision: {
      assessments: [{ ...assessment, verdict: "incorrect" }],
      supervisor: {
        trigger: "correction",
        text: "Untrusted model text",
        reference_ids: [objective.reference_ids[0]],
      },
    },
    unresolved_misconception_id: misconception.id,
  });
  assert.equal(corrected.kind, "reply");
  if (corrected.kind !== "reply") return;
  assert.equal(corrected.role, "supervisor");
  assert.ok(corrected.text.includes(misconception.correction));
  assert.ok(!corrected.text.includes("Untrusted model text"));
  const ordinaryWrong = selectNextTurn({
    ...base,
    decision: {
      assessments: [{ ...assessment, verdict: "incorrect" }],
      supervisor: {
        trigger: "correction",
        text: "Untrusted model text",
        reference_ids: [objective.reference_ids[0]],
      },
    },
  });
  assert.equal(ordinaryWrong.kind, "reply");
  if (ordinaryWrong.kind !== "reply") return;
  assert.equal(ordinaryWrong.role, "supervisor");
  assert.equal(ordinaryWrong.misconception_id, null);
  assert.ok(ordinaryWrong.text.includes(objective.correction_criteria[0]));
  assert.ok(!ordinaryWrong.text.includes("Untrusted model text"));
});
