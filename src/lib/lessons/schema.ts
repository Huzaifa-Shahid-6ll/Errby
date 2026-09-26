import { z } from "zod";

const text = z.string().trim().min(1).max(2000);
const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
const statements = z.array(text).min(1).max(10);
const referenceIds = z.array(id).max(20);

export const sourceReferenceSchema = z.strictObject({
  id,
  source_id: id,
  location: z.discriminatedUnion("kind", [
    z.strictObject({
      kind: z.literal("page"),
      index: z.number().int().positive(),
    }),
    z.strictObject({
      kind: z.literal("paragraph"),
      index: z.number().int().positive(),
    }),
    z.strictObject({ kind: z.literal("section"), label: text }),
  ]),
  text,
  text_kind: z.enum(["excerpt", "summary"]),
  purpose: z.enum(["evidence", "scope"]),
  status: z.enum(["unverified", "source_checked", "conflicting"]),
});

const misconceptionSchema = z.strictObject({
  id,
  question: text,
  correction: text,
  correction_criteria: statements,
  reference_ids: referenceIds,
  changed_example_question: text,
});

export const lessonSchema = z
  .strictObject({
    schema_version: z.literal("1.1"),
    id,
    version: z.number().int().positive(),
    title: z.string().trim().min(1).max(160),
    grade_band: z.string().trim().min(1).max(100),
    language: z.literal("en"),
    content_origin: z.enum(["generated_draft", "human_authored"]),
    illustrative_only: z.boolean(),
    initial_question: text,
    application_question: text,
    sources: z
      .array(
        z.strictObject({
          id,
          title: text,
          kind: z.enum(["text", "pdf", "docx", "web", "outline"]),
          url: z.url({ protocol: /^https$/ }).nullable(),
          provenance: text,
        }),
      )
      .max(20),
    references: z.array(sourceReferenceSchema).max(100),
    objectives: z
      .array(
        z.strictObject({
          id,
          title: text,
          required: z.boolean(),
          criteria: statements,
          acceptable_explanations: statements,
          essential_facts: statements,
          correction_criteria: statements,
          reference_ids: referenceIds,
          misconceptions: z.array(misconceptionSchema).max(5),
          follow_up_questions: statements,
          application_question: text,
          unresolved_issues: z.array(text).max(10),
        }),
      )
      .min(1)
      .max(5),
    teacher_review: z.discriminatedUnion("status", [
      z.strictObject({ status: z.literal("pending") }),
      z.strictObject({
        status: z.literal("approved"),
        reviewer_id: z.uuid(),
        reviewed_at: z.iso.datetime(),
        lesson_version: z.number().int().positive(),
      }),
    ]),
  })
  .superRefine((lesson, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    const unique = (ids: string[], path: (string | number)[]) => {
      if (new Set(ids).size !== ids.length)
        issue(path, "Duplicate IDs are not allowed.");
    };
    unique(
      lesson.sources.map((source) => source.id),
      ["sources"],
    );
    unique(
      lesson.references.map((reference) => reference.id),
      ["references"],
    );
    unique(
      lesson.objectives.map((objective) => objective.id),
      ["objectives"],
    );
    unique(
      lesson.objectives.flatMap((objective) =>
        objective.misconceptions.map((item) => item.id),
      ),
      ["objectives"],
    );
    const sources = new Set(lesson.sources.map((source) => source.id));
    const references = new Map(
      lesson.references.map((reference) => [reference.id, reference]),
    );
    lesson.references.forEach((reference, index) => {
      if (!sources.has(reference.source_id))
        issue(["references", index, "source_id"], "Unknown source ID.");
      if (
        reference.purpose === "evidence" &&
        lesson.sources.find((source) => source.id === reference.source_id)
          ?.kind === "outline"
      ) {
        issue(
          ["references", index, "purpose"],
          "An outline supplies scope, not answer evidence.",
        );
      }
    });
    const checkReferences = (ids: string[], path: (string | number)[]) => {
      unique(ids, path);
      ids.forEach((referenceId, index) => {
        const reference = references.get(referenceId);
        if (!reference) issue([...path, index], "Unknown reference ID.");
        else if (reference.purpose !== "evidence")
          issue(
            [...path, index],
            "Scope sources cannot serve as answer evidence.",
          );
      });
    };
    lesson.objectives.forEach((objective, index) => {
      if (
        (!objective.reference_ids.length ||
          objective.misconceptions.some(
            (item) => !item.reference_ids.length,
          )) &&
        !objective.unresolved_issues.length
      ) {
        issue(
          ["objectives", index, "unresolved_issues"],
          "Missing evidence must be explicitly flagged as unresolved.",
        );
      }
      checkReferences(objective.reference_ids, [
        "objectives",
        index,
        "reference_ids",
      ]);
      objective.misconceptions.forEach((misconception, misconceptionIndex) => {
        checkReferences(misconception.reference_ids, [
          "objectives",
          index,
          "misconceptions",
          misconceptionIndex,
          "reference_ids",
        ]);
        if (
          misconception.reference_ids.some(
            (referenceId) => !objective.reference_ids.includes(referenceId),
          )
        ) {
          issue(
            [
              "objectives",
              index,
              "misconceptions",
              misconceptionIndex,
              "reference_ids",
            ],
            "Correction evidence must belong to its objective.",
          );
        }
      });
    });
    if (!lesson.objectives.some((objective) => objective.required))
      issue(["objectives"], "At least one objective must be required.");
    if (
      lesson.teacher_review.status === "approved" &&
      lesson.teacher_review.lesson_version !== lesson.version
    ) {
      issue(
        ["teacher_review", "lesson_version"],
        "Review must belong to this lesson version.",
      );
    }
  });

// Content readiness only: future publish handlers must load trusted review metadata
// and enforce teacher/owner authorization server-side before storing a version.
export const publicationReadyLessonSchema = lessonSchema.superRefine(
  (lesson, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    if (lesson.illustrative_only)
      issue(
        ["illustrative_only"],
        "Illustrative fixtures cannot be published.",
      );
    if (lesson.teacher_review.status !== "approved")
      issue(["teacher_review"], "Teacher review is required.");
    const references = new Map(
      lesson.references.map((reference) => [reference.id, reference]),
    );
    if (
      lesson.references.some(
        (reference) => reference.status !== "source_checked",
      )
    )
      issue(
        ["references"],
        "Resolve and source-check every saved reference before publication.",
      );
    lesson.objectives.forEach((objective, index) => {
      if (objective.unresolved_issues.length)
        issue(
          ["objectives", index, "unresolved_issues"],
          "Resolve content issues before publication.",
        );
      if (
        !objective.reference_ids.length ||
        objective.misconceptions.some((item) => !item.reference_ids.length) ||
        [
          ...objective.reference_ids,
          ...objective.misconceptions.flatMap((item) => item.reference_ids),
        ].some(
          (referenceId) =>
            references.get(referenceId)?.status !== "source_checked",
        )
      ) {
        issue(
          ["objectives", index, "reference_ids"],
          "Unverified or conflicting evidence blocks publication.",
        );
      }
    });
  },
);

export type Lesson = z.infer<typeof lessonSchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
