import assert from "node:assert/strict";
import { test } from "node:test";
import { answerExamples } from "../src/lib/lessons/answer-examples";
import { exampleLessons } from "../src/lib/lessons/examples";
import { validateEvaluationDecision } from "../src/lib/ai/evaluation";

test("24 fictional expectations cover two topics and the required risk cases", () => {
  assert.equal(answerExamples.length, 24);
  assert.equal(new Set(answerExamples.map((item) => item.lesson_id)).size, 2);
  assert.ok(
    answerExamples.filter((item) => item.expected_verdict === "incorrect")
      .length >= 8,
  );
  assert.ok(
    answerExamples.filter((item) => item.expected_verdict === "unverified")
      .length >= 4,
  );
  for (const item of answerExamples) {
    const lesson = exampleLessons.find(
      (candidate) => candidate.id === item.lesson_id,
    );
    assert.ok(lesson);
    assert.ok(
      lesson.objectives.some((objective) => objective.id === item.objective_id),
    );
  }
});

test("decision gate rejects fabricated evidence, copied credit and missing interventions", () => {
  const item = answerExamples[0];
  const lesson = exampleLessons[0];
  const objective = lesson.objectives.find(
    (entry) => entry.id === item.objective_id,
  )!;
  const referenceId = objective.reference_ids.find((id) =>
    lesson.references.some(
      (reference) =>
        reference.id === id && reference.status === "source_checked",
    ),
  )!;
  const decision = {
    assessments: [
      {
        objective_id: item.objective_id,
        verdict: "correct",
        learner_quote: item.learner_answer,
        reason: "Explains direction",
        reference_ids: [referenceId],
        assisted: false,
        independent: true,
        uncertainty_reason: null,
      },
    ],
    supervisor: { trigger: "none" },
  };
  assert.equal(
    validateEvaluationDecision(decision, lesson, item.learner_answer)
      .assessments[0].verdict,
    "correct",
  );
  assert.throws(
    () =>
      validateEvaluationDecision(
        decision,
        lesson,
        item.learner_answer,
        item.learner_answer,
      ),
    /Copied correction/,
  );
  assert.throws(
    () =>
      validateEvaluationDecision(
        {
          ...decision,
          assessments: [
            { ...decision.assessments[0], reference_ids: ["fake"] },
          ],
        },
        lesson,
        item.learner_answer,
      ),
    /Reference/,
  );
  assert.throws(
    () =>
      validateEvaluationDecision(
        {
          ...decision,
          assessments: [{ ...decision.assessments[0], reference_ids: [] }],
        },
        lesson,
        item.learner_answer,
      ),
    /Absent source evidence/,
  );
  assert.throws(
    () =>
      validateEvaluationDecision(
        {
          ...decision,
          assessments: [
            { ...decision.assessments[0], learner_quote: "invented" },
          ],
        },
        lesson,
        item.learner_answer,
      ),
    /Learner quote/,
  );
  assert.throws(
    () =>
      validateEvaluationDecision(
        {
          ...decision,
          assessments: [{ ...decision.assessments[0], verdict: "incorrect" }],
        },
        lesson,
        item.learner_answer,
      ),
    /Supervisor trigger/,
  );
  const wrong = answerExamples.find(
    (entry) => entry.expected_verdict === "incorrect",
  )!;
  const wrongLesson = exampleLessons.find(
    (entry) => entry.id === wrong.lesson_id,
  )!;
  const wrongObjective = wrongLesson.objectives.find(
    (entry) => entry.id === wrong.objective_id,
  )!;
  const wrongRef = wrongObjective.reference_ids.find((id) =>
    wrongLesson.references.some(
      (entry) => entry.id === id && entry.status === "source_checked",
    ),
  )!;
  assert.equal(
    validateEvaluationDecision(
      {
        assessments: [
          {
            objective_id: wrong.objective_id,
            verdict: "incorrect",
            learner_quote: wrong.learner_answer,
            reason: "Contradicts source",
            reference_ids: [wrongRef],
            assisted: false,
            independent: true,
            uncertainty_reason: null,
          },
        ],
        supervisor: {
          trigger: "correction",
          text: "Check the relationship and explain it again.",
          reference_ids: [wrongRef],
        },
      },
      wrongLesson,
      wrong.learner_answer,
    ).supervisor.trigger,
    "correction",
  );
});
