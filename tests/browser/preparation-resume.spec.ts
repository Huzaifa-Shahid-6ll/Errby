import { test, expect } from "@playwright/test";

test("API-mocked UI transport only: teacher import retains invalid input and renders an unreviewed snapshot", async ({
  page,
}) => {
  const state = saved();
  state.can_author = true;
  state.job.current_step = 1;
  state.job.status = "drafting";
  const draft = {
    title: "Synthetic authored draft",
    version: 1,
    illustrative_only: true,
    objectives: [{ id: "sides", title: "Explain sides" }],
    teacher_review: { status: "pending" },
  };
  await page.route(`**/api/preparations/${id}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/preparations/${id}/step`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({ expected_step: 1, draft });
    await route.fulfill({
      json: {
        ...state,
        lesson: draft,
        job: { ...state.job, current_step: 2, status: "needs_review" },
      },
    });
  });
  await page.goto(`/prepare/${id}`);
  await page.getByText("Teacher: import a manually authored draft").click();
  const input = page.getByRole("textbox", { name: "Unreviewed lesson JSON" });
  await input.fill("{");
  await page
    .getByRole("button", { name: "Save unreviewed lesson snapshot" })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "JSON is invalid",
  );
  await expect(input).toHaveValue("{");
  await input.fill(JSON.stringify(draft));
  await page
    .getByRole("button", { name: "Save unreviewed lesson snapshot" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Synthetic authored draft" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "teacher review required",
  );
});

const id = "00000000-0000-4000-8000-000000000021";
function saved() {
  return {
    can_author: false,
    lesson: null,
    job: {
      id,
      owner_id: "00000000-0000-4000-8000-000000000001",
      source_id: "00000000-0000-4000-8000-000000000031",
      class_id: null,
      status: "pending",
      current_step: 0,
      completed_steps: {},
      lease_until: null,
      created_at: "2026-09-19T00:00:00Z",
      updated_at: "2026-09-19T00:00:00Z",
      error_code: null,
      partial_results: {
        status: "extracted_needs_review",
        context: {
          subject: "Math",
          grade: "Grade 7",
          scope: "Explain fictional triangles",
        },
        questions: [],
        extraction: {
          kind: "text",
          source_role: "evidence",
          provenance: "fictional_unreviewed",
          sha256: "a".repeat(64),
          parser: "errby-text/1",
          pages: [
            { page: 1, text: "Fictional source: a triangle has three sides." },
          ],
          text: "Fictional source: a triangle has three sides.",
          sample: "Fictional source: a triangle has three sides.",
          coverage: {
            total_pages: 1,
            text_pages: 1,
            missing_pages: [] as number[],
          },
          warnings: [],
        },
      },
    },
  };
}

test("API-mocked UI: refresh resumes a pending saved step once and keeps learners out of draft import", async ({
  page,
}) => {
  const state = saved();
  let steps = 0;
  await page.route(`**/api/preparations/${id}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/preparations/${id}/step`, async (route) => {
    steps++;
    expect(route.request().postDataJSON()).toEqual({ expected_step: 0 });
    state.job.current_step = 1;
    state.job.status = "drafting";
    await route.fulfill({ json: state });
  });
  await page.goto(`/prepare/${id}`);
  await expect(page.getByRole("status")).toContainText(
    "waiting for a lesson draft",
    { timeout: 30000 },
  );
  expect(steps).toBe(1);
  await page.reload();
  await expect(page.getByRole("status")).toContainText(
    "waiting for a lesson draft",
  );
  expect(steps).toBe(1);
  await expect(
    page.getByText("Explain fictional triangles", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Teacher: import a manually authored draft"),
  ).toHaveCount(0);
  await page.getByText("Read saved extracted text").click();
  await expect(
    page.getByText("Fictional source: a triangle has three sides.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("API-mocked UI: clarification failure preserves edits and loading can retry", async ({
  page,
}) => {
  const state = saved();
  state.job.status = "needs_clarification";
  state.job.partial_results.status = "needs_clarification";
  state.job.partial_results.context.subject = "";
  // Dev Strict Mode may replay the loading effect. Keep failure deterministic
  // until the test explicitly enables recovery before the user's retry.
  let failLoading = true;
  await page.route(`**/api/preparations/${id}`, (route) => {
    return failLoading
      ? route.fulfill({
          status: 503,
          json: { user_message: "Synthetic unavailable server" },
        })
      : route.fulfill({ json: state });
  });
  await page.route(`**/api/preparations/${id}/step`, (route) => route.abort());
  await page.goto(`/prepare/${id}`);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Synthetic unavailable server",
  );
  failLoading = false;
  await page.getByRole("button", { name: "Retry loading" }).click();
  await page
    .getByRole("textbox", { name: "Subject", exact: true })
    .fill("Edited subject");
  await page
    .getByRole("button", { name: "Save clarification and continue" })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Subject", exact: true }),
  ).toHaveValue("Edited subject");
});

test("API-mocked UI: missing PDF pages offer replacement instead of an endless clarification", async ({
  page,
}) => {
  const state = saved();
  state.job.status = "needs_clarification";
  state.job.partial_results.status = "partial";
  state.job.partial_results.extraction.coverage.missing_pages = [2];
  await page.route(`**/api/preparations/${id}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.goto(`/prepare/${id}`);
  await expect(
    page.getByRole("link", { name: "Prepare a replacement source" }),
  ).toHaveAttribute("href", "/prepare");
  await expect(
    page.getByRole("button", { name: "Save clarification and continue" }),
  ).toHaveCount(0);
});

test("API-mocked UI: generated private practice remains unreviewed and links to session creation", async ({
  page,
}) => {
  const state = saved();
  state.job.current_step = 1;
  state.job.status = "drafting";
  await page.route(`**/api/preparations/${id}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/preparations/${id}/step`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({ expected_step: 1 });
    await route.fulfill({
      json: {
        ...state,
        review_status: "private_ready",
        job: {
          ...state.job,
          current_step: 2,
          partial_results: {
            ...state.job.partial_results,
            lesson_version_id: id,
          },
        },
        lesson: {
          title: "Synthetic private practice",
          version: 1,
          illustrative_only: false,
          objectives: [{ id: "sides", title: "Explain sides" }],
        },
      },
    });
  });
  await page.route("**/api/sessions", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ lesson_version_id: id });
    await route.fulfill({
      status: 503,
      json: { user_message: "Synthetic session request received" },
    });
  });
  await page.goto(`/prepare/${id}`);
  await page.getByRole("button", { name: "Generate lesson draft" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Private practice ready — not teacher reviewed",
  );
  await expect(page.getByText(/AI-generated private practice/)).toBeVisible();
  await page
    .getByRole("button", { name: "Start session: Synthetic private practice" })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Synthetic session request received",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
