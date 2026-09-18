import assert from "node:assert/strict";
import test from "node:test";
import { exampleLessons } from "../src/lib/lessons/examples";
import { answerExamples } from "../src/lib/lessons/answer-examples";
import { demoLesson } from "../src/lib/lessons/demo";
import {
  lessonSchema,
  publicationReadyLessonSchema,
  type Lesson,
} from "../src/lib/lessons/schema";

test("source-checked examples retain teacher review gates and the supplied demo stays unreviewed", () => {
  for (const lesson of exampleLessons) {
    assert.ok(lessonSchema.safeParse(lesson).success);
    assert.equal(lesson.teacher_review.status, "pending");
    assert.equal(publicationReadyLessonSchema.safeParse(lesson).success, false);
  }
  assert.equal(demoLesson.teacher_review.reviewed, false);
  assert.equal(demoLesson.reference_status, "unverified_until_review");
});

test("a single supported objective is valid but an empty lesson or pending publication is not", () => {
  const lesson = structuredClone(exampleLessons[0]);
  lesson.objectives = [lesson.objectives[0]];
  lesson.references = lesson.references.filter((reference) =>
    lesson.objectives[0].reference_ids.includes(reference.id),
  );
  lesson.sources = lesson.sources.filter((source) =>
    lesson.references.some((reference) => reference.source_id === source.id),
  );
  assert.ok(lessonSchema.safeParse(lesson).success);
  assert.equal(publicationReadyLessonSchema.safeParse(lesson).success, false);
  assert.equal(
    lessonSchema.safeParse({ ...lesson, objectives: [] }).success,
    false,
  );
});

test("lesson boundary rejects invalid references, duplicate IDs and missing explanation/correction evidence", () => {
  const invalidEdits: ((lesson: Lesson) => void)[] = [
    (lesson) => {
      lesson.objectives[0].reference_ids = ["invented-reference"];
    },
    (lesson) => {
      lesson.references[0].source_id = "invented-source";
    },
    (lesson) => {
      lesson.sources[0].kind = "outline";
    },
    (lesson) => {
      lesson.references[0].purpose = "scope";
    },
    (lesson) => {
      lesson.objectives[0].criteria = [" "];
    },
    (lesson) => {
      lesson.objectives[0].acceptable_explanations = [];
    },
    (lesson) => {
      lesson.objectives[0].correction_criteria = [];
    },
    (lesson) => {
      lesson.objectives[0].misconceptions[0].correction_criteria = [];
    },
    (lesson) => {
      lesson.objectives[0].misconceptions[0].reference_ids = ["melting-ref"];
    },
    (lesson) => {
      lesson.objectives[1].id = lesson.objectives[0].id;
    },
    (lesson) => {
      lesson.sources[1].id = lesson.sources[0].id;
    },
    (lesson) => {
      lesson.references[1].id = lesson.references[0].id;
    },
    (lesson) => {
      lesson.objectives[1].misconceptions[0].id =
        lesson.objectives[0].misconceptions[0].id;
    },
    (lesson) => {
      lesson.objectives[0].reference_ids.push(
        lesson.objectives[0].reference_ids[0],
      );
    },
    (lesson) => {
      lesson.objectives.forEach((objective) => {
        objective.required = false;
      });
    },
    (lesson) => {
      lesson.references[0].location = { kind: "page", index: 0 };
    },
  ];
  for (const edit of invalidEdits) {
    const lesson = structuredClone(exampleLessons[0]);
    edit(lesson);
    assert.equal(lessonSchema.safeParse(lesson).success, false, String(edit));
  }
  assert.equal(
    lessonSchema.safeParse({ ...exampleLessons[0], session_complete: true })
      .success,
    false,
  );
});

test("publication readiness fails closed for unresolved or unverified content despite claimed approval", () => {
  const candidate = structuredClone(exampleLessons[0]);
  candidate.illustrative_only = false;
  candidate.teacher_review = {
    status: "approved",
    reviewer_id: "11111111-1111-4111-8111-111111111111",
    reviewed_at: "2026-09-18T12:00:00Z",
    lesson_version: 1,
  };
  // Synthetic metadata exercises content validation, not an authenticated publish.
  assert.ok(publicationReadyLessonSchema.safeParse(candidate).success);
  for (const status of ["unverified", "conflicting"] as const) {
    const invalid = structuredClone(candidate);
    invalid.references[0].status = status;
    assert.equal(
      publicationReadyLessonSchema.safeParse(invalid).success,
      false,
    );
  }
  const unresolved = structuredClone(candidate);
  unresolved.objectives[0].unresolved_issues = [
    "Contradictory source needs review.",
  ];
  assert.equal(
    publicationReadyLessonSchema.safeParse(unresolved).success,
    false,
  );
  assert.equal(
    publicationReadyLessonSchema.safeParse({ ...candidate, version: 2 })
      .success,
    false,
  );
  assert.equal(
    publicationReadyLessonSchema.safeParse({
      ...candidate,
      teacher_review: { status: "approved" },
    }).success,
    false,
  );
});

test("unsupported drafts preserve missing evidence without inventing references or passing publication", () => {
  const draft = structuredClone(exampleLessons[0]);
  draft.sources = [];
  draft.references = [];
  draft.objectives.forEach((objective) => {
    objective.reference_ids = [];
    objective.misconceptions.forEach((item) => {
      item.reference_ids = [];
    });
    objective.unresolved_issues = [
      "No explanatory source supplied; generated claims remain unverified.",
    ];
  });
  assert.ok(lessonSchema.safeParse(draft).success);
  assert.equal(publicationReadyLessonSchema.safeParse(draft).success, false);
  draft.objectives[0].unresolved_issues = [];
  assert.equal(lessonSchema.safeParse(draft).success, false);
});

test("24 fictional expected answers resolve to objectives and cover the documented critical categories", () => {
  assert.equal(answerExamples.length, 24);
  assert.equal(new Set(answerExamples.map((item) => item.id)).size, 24);
  assert.equal(
    answerExamples.filter((item) => item.expected_verdict === "incorrect")
      .length,
    8,
  );
  assert.equal(
    answerExamples.filter((item) => item.expected_verdict === "unverified")
      .length,
    4,
  );
  assert.equal(
    answerExamples.filter(
      (item) =>
        item.expected_verdict === "correct" && !item.independent_evidence,
    ).length,
    2,
  );
  for (const example of answerExamples) {
    const lesson = exampleLessons.find((item) => item.id === example.lesson_id);
    assert.ok(
      lesson?.objectives.some(
        (objective) => objective.id === example.objective_id,
      ),
    );
    assert.ok(
      example.preceding_message && example.learner_answer && example.reason,
    );
  }
});
