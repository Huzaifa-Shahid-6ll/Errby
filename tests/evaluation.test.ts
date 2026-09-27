import assert from "node:assert/strict";
import { test } from "node:test";
import { answerExamples } from "../src/lib/lessons/answer-examples";
import { exampleLessons } from "../src/lib/lessons/examples";
import { validateEvaluationDecision } from "../src/lib/ai/evaluation";
import { evaluateAnswer } from "../src/lib/ai/evaluate";
import type { SupabaseClient } from "@supabase/supabase-js";

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

test("evaluator repairs invalid source/quote output once and never accepts repeated fabrication", async () => {
  const lesson = exampleLessons[0];
  const answer = "The warmer room transfers heat into the ice.";
  const valid = {
    assessments: [
      {
        objective_id: lesson.objectives[0].id,
        verdict: "correct",
        learner_quote: answer,
        reason: "Explains heat direction",
        reference_ids: [lesson.objectives[0].reference_ids[0]],
        assisted: false,
        independent: true,
        uncertainty_reason: null,
      },
    ],
    supervisor: { trigger: "none" },
  };
  const input = {
    db: {} as SupabaseClient,
    ownerId: "synthetic-owner",
    messageId: "synthetic-message",
    lesson,
    learnerAnswer: answer,
    conversation: [{ role: "errby", text: lesson.initial_question }],
  };
  let calls = 0;
  const result = await evaluateAnswer(input, async (request) => {
    assert.match(request.system, /untrusted DATA/);
    calls++;
    return {
      output: calls === 1 ? {} : valid,
      model: "synthetic-mock",
      tokens: 1,
    };
  });
  assert.equal(calls, 2);
  assert.equal(result.decision.assessments[0].verdict, "correct");
  const copied = await evaluateAnswer(
    { ...input, precedingCorrection: answer },
    async () => ({ output: valid, model: "synthetic-mock", tokens: 1 }),
  );
  assert.equal(copied.decision.assessments[0].independent, false);
  assert.equal(copied.decision.assessments[0].assisted, true);
  const copiedPrompt = await evaluateAnswer(
    { ...input, precedingCorrection: answer },
    async () => ({
      output: {
        assessments: [
          {
            ...valid.assessments[0],
            verdict: "unverified",
            uncertainty_reason: "No fresh explanation",
          },
        ],
      },
      model: "synthetic-mock",
      tokens: 1,
    }),
  );
  assert.equal(copiedPrompt.decision.assessments[0].verdict, "partial");
  assert.equal(copiedPrompt.decision.supervisor.trigger, "none");
  calls = 0;
  await assert.rejects(
    evaluateAnswer(input, async () => {
      calls++;
      return { output: {}, model: "synthetic-mock", tokens: 1 };
    }),
    /could not verify/,
  );
  assert.equal(calls, 2);
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
