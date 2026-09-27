import { test, expect } from "@playwright/test";
import { exampleLessons } from "../../src/lib/lessons/examples";

test("API-mocked synthetic review: unsaved edits cannot be approved or published", async ({
  page,
}) => {
  const id = "00000000-0000-4000-8000-000000000021";
  let state = {
    can_author: true,
    review_status: "needs_review",
    lesson: structuredClone(exampleLessons[0]),
    job: {
      id,
      class_id: "00000000-0000-4000-8000-000000000031",
      current_step: 2,
      status: "needs_review",
      lease_until: null,
      partial_results: {
        lesson_version_id: "00000000-0000-4000-8000-000000000041",
        status: "extracted_needs_review",
        context: {
          subject: "Synthetic science",
          grade: "Grade 7",
          scope: "Synthetic review",
        },
        questions: [],
        extraction: {
          text: "Synthetic source",
          pages: [{ page: 1, text: "Synthetic source" }],
          warnings: [],
          coverage: { total_pages: 1, text_pages: 1, missing_pages: [] },
        },
      },
    },
  };
  const actions: string[] = [];
  await page.route(`**/api/preparations/${id}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/preparations/${id}/review`, async (route) => {
    const body = route.request().postDataJSON();
    expect(body.expected_version_id).toBe(
      state.job.partial_results.lesson_version_id,
    );
    actions.push(body.action);
    const lesson =
      body.action === "edit"
        ? body.lesson
        : { ...state.lesson, version: state.lesson.version + 1 };
    state = {
      ...state,
      lesson,
      review_status:
        body.action === "edit"
          ? "needs_review"
          : body.action === "review"
            ? "approved"
            : "published",
      job: {
        ...state.job,
        partial_results: {
          ...state.job.partial_results,
          lesson_version_id: `00000000-0000-4000-8000-${String(41 + actions.length).padStart(12, "0")}`,
        },
      },
    };
    await route.fulfill({ json: state });
  });
  await page.goto(`/prepare/${id}`);
  const review = page.getByRole("region", { name: "Teacher lesson review" });
  const approve = review.getByRole("button", {
    name: "Approve current saved version after review",
  });
  await expect(approve).toBeEnabled();
  await review
    .getByLabel("Lesson title", { exact: true })
    .fill("Synthetic edited lesson");
  await expect(approve).toBeDisabled();
  await review
    .getByLabel("Review finding")
    .first()
    .selectOption("source_checked");
  await review
    .getByRole("button", { name: "Save edited draft as next version" })
    .click();
  await expect(approve).toBeEnabled();
  await approve.click();
  await review.getByLabel("Publish this approved version to the class").check();
  const publish = review.getByRole("button", {
    name: "Publish class lesson",
    exact: true,
  });
  await expect(publish).toBeEnabled();
  await review
    .getByLabel("Lesson title", { exact: true })
    .fill("Unsaved change");
  await expect(publish).toBeDisabled();
  await review
    .getByLabel("Lesson title", { exact: true })
    .fill("Synthetic edited lesson");
  await publish.click();
  await expect(review).toContainText("available to active learners");
  await expect(review.getByRole("textbox")).toHaveCount(0);
  expect(actions).toEqual(["edit", "review", "publish"]);
  await page.reload();
  await expect(review).toContainText("published");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
