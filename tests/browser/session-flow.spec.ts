import { expect, test } from "@playwright/test";

const sessionId = "00000000-0000-4000-8000-000000000300";
const message = (sequence: number, role: string, text: string) => ({
  id: `00000000-0000-4000-8000-${String(900 + sequence).padStart(12, "0")}`,
  sequence,
  role,
  text,
  created_at: "2026-09-22T00:00:00Z",
});
const OPENING = "How does warmth move along a metal spoon sitting in hot soup?";

test("real demo API and session page fail closed without live configuration", async ({
  request,
  page,
}) => {
  for (const probe of [
    () => request.get(`/api/sessions/${sessionId}`),
    () =>
      request.post("/api/sessions", {
        headers: { Origin: "http://127.0.0.1:3100" },
        data: { lesson_version_id: sessionId },
      }),
    () =>
      request.post(`/api/sessions/${sessionId}/turns`, {
        headers: { Origin: "http://127.0.0.1:3100" },
        data: {
          text: "answer",
          expected_sequence: 0,
          idempotency_key: sessionId,
        },
      }),
  ]) {
    const response = await probe();
    expect(response.status()).toBe(503);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.json()).toMatchObject({
      error_code: "live_setup_required",
    });
  }
  await page.goto(`/learn/sessions/${sessionId}`);
  await expect(page.getByRole("alert")).toContainText("live mode", {
    timeout: 30000,
  });
  await expect(
    page.getByRole("button", { name: "Retry loading" }),
  ).toBeVisible();
});

test("API-mocked session UI: genuine opening question, one saved answer and honest ungraded state", async ({
  page,
}) => {
  const state = {
    session: {
      id: sessionId,
      status: "awaiting_student",
      visibility: "class",
      lesson_title: "Fictional heat transfer",
      objective_labels: ["Explain heat flow"],
      opened_at: "2026-09-22T00:00:00Z",
      last_sequence: 0,
    },
    messages: [message(0, "errby", OPENING)],
  };
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${sessionId}/turns`, async (route) => {
    const body = route.request().postDataJSON();
    expect(body.text).toBe(
      "The soup heats one end and the metal carries the warmth along.",
    );
    expect(body.expected_sequence).toBe(0);
    expect(body.idempotency_key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    const saved = message(
      1,
      "student",
      "The soup heats one end and the metal carries the warmth along.",
    );
    state.session = {
      ...state.session,
      status: "evaluating",
      last_sequence: 1,
    };
    state.messages = [...state.messages, saved];
    await route.fulfill({
      json: { session: state.session, message: saved },
    });
  });
  await page.goto(`/learn/sessions/${sessionId}`);
  await expect(
    page.getByRole("heading", { name: "Fictional heat transfer" }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(OPENING)).toBeVisible();
  await expect(page.getByRole("button", { name: "Send answer" })).toBeEnabled();
  const answer = page.getByRole("textbox", { name: "Your explanation" });
  await answer.fill(
    "The soup heats one end and the metal carries the warmth along.",
  );
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect(
    page.getByText(
      "The soup heats one end and the metal carries the warmth along.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Answer saved.");
  await expect(page.getByRole("status")).toContainText("not graded");
  await expect(answer).toHaveValue("");
  await expect(answer).toBeDisabled();
  await page.reload();
  await expect(
    page.getByText(
      "The soup heats one end and the metal carries the warmth along.",
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("API-mocked session UI: submission failure retains the answer text", async ({
  page,
}) => {
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({
      json: {
        session: {
          id: sessionId,
          status: "awaiting_student",
          visibility: "class",
          lesson_title: "Fictional heat transfer",
          objective_labels: [],
          opened_at: "2026-09-22T00:00:00Z",
          last_sequence: 0,
        },
        messages: [message(0, "errby", OPENING)],
      },
    }),
  );
  await page.route(`**/api/sessions/${sessionId}/turns`, (route) =>
    route.fulfill({
      status: 409,
      json: {
        error_code: "sequence_conflict",
        user_message:
          "The session moved on. Reload it; your answer was not saved twice.",
      },
    }),
  );
  await page.goto(`/learn/sessions/${sessionId}`);
  const answer = page.getByRole("textbox", { name: "Your explanation" });
  await expect(answer).toBeEnabled({ timeout: 30000 });
  await answer.fill("My unsaved explanation stays in the composer.");
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect(page.getByRole("status")).toContainText("The session moved on");
  await expect(answer).toHaveValue(
    "My unsaved explanation stays in the composer.",
  );
  await expect(answer).toBeEnabled();
});
