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
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "live mode",
    {
      timeout: 30000,
    },
  );
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

// Fictional, unreviewed UI responses only; these never exercise a live evaluator.
const fictionalState = (
  status: import("../../src/lib/sessions/contracts").SessionStatus = "awaiting_student",
) => ({
  session: {
    id: sessionId,
    status,
    visibility: "private" as const,
    lesson_title: "Fictional chat · unreviewed test",
    objective_labels: ["Explain heat flow", "Use your own example"],
    opened_at: "2026-09-22T00:00:00Z",
    last_sequence: 2,
  },
  messages: [
    message(0, "errby", OPENING),
    message(1, "student", "First line.\nSecond line."),
    message(
      2,
      "supervisor",
      "This fictional guidance is unreviewed.\nTry explaining with another example.",
    ),
  ],
});

test("API-mocked quiet supervision: accessible identity, safe text and responsive themes", async ({
  page,
}, testInfo) => {
  const state = fictionalState("needs_review");
  state.messages[1].text += '\n<img src=x onerror="window.injected=true">';
  state.messages[2].text += `\n${"LongFictionalText".repeat(70)}`;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.goto(`/learn/sessions/${sessionId}`);
  const conversation = page.getByRole("list", { name: "Conversation" });
  await expect(conversation).toBeVisible({ timeout: 30000 });
  await expect(conversation.getByRole("listitem")).toHaveCount(3);
  await expect(conversation.getByText("Errby", { exact: true })).toHaveCount(2);
  await expect(conversation.getByText("You", { exact: true })).toBeVisible();
  await expect(
    conversation.getByText("Supervisor", { exact: true }),
  ).toHaveCount(0);
  await expect(conversation.locator("svg")).toHaveCount(3);
  await expect(conversation.locator("img")).toHaveCount(0);
  await expect(conversation.locator(".session-student p")).toHaveCSS(
    "white-space",
    "pre-wrap",
  );
  await expect(page.getByRole("status")).toContainText("remain unresolved");
  await expect(
    page.locator(".session-goals-desktop, .session-goals-mobile"),
  ).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("chat-light.png"),
    fullPage: true,
  });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(conversation.locator(".session-errby").last()).toHaveCSS(
    "background-color",
    "rgb(36, 43, 72)",
  );
  await expect(
    page.getByRole("button", { name: "Refresh saved session" }),
  ).toHaveCSS("color", "rgb(244, 247, 252)");
  await page.screenshot({
    path: testInfo.outputPath("chat-dark.png"),
    fullPage: true,
  });
  await page.addStyleTag({
    content:
      "html { font-size: 200%; } .session-shell { filter: grayscale(1); }",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    conversation.getByText("Supervisor", { exact: true }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("API-mocked saved states: only awaiting_student accepts answers and uncertainty never completes", async ({
  page,
}) => {
  const states = {
    ready: "Ready",
    awaiting_student: "Your turn",
    evaluating: "Answer saved · not graded",
    supervisor_pending: "Supervisor guidance pending",
    errby_ready: "Errby reply pending",
    needs_review: "Needs review · unresolved",
    paused: "Paused",
    ended_incomplete: "Ended · incomplete",
    completed: "Completed",
  } as const;
  const state = fictionalState();
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.goto(`/learn/sessions/${sessionId}`);
  for (const [status, label] of Object.entries(states)) {
    state.session.status = status as keyof typeof states;
    await page.getByRole("button", { name: "Refresh saved session" }).click();
    await expect(page.getByRole("status").locator("strong")).toHaveText(label);
    if (status === "awaiting_student")
      await expect(page.getByRole("textbox")).toBeEnabled();
    else await expect(page.getByRole("textbox")).toBeDisabled();
    await expect(page.getByRole("button", { name: "Send answer" })).toBeEnabled(
      { enabled: status === "awaiting_student" },
    );
  }
});

test("API-mocked retry: uncertain save keeps text and key, edits receive a new key, refresh keeps drafts", async ({
  page,
}) => {
  const state = fictionalState();
  const requests: {
    text: string;
    expected_sequence: number;
    idempotency_key: string;
  }[] = [];
  let failRefresh = false;
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    failRefresh
      ? route.fulfill({
          status: 503,
          json: { user_message: "Fictional connection failure." },
        })
      : route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${sessionId}/turns`, (route) => {
    requests.push(route.request().postDataJSON());
    return route.abort("failed");
  });
  await page.goto(`/learn/sessions/${sessionId}`);
  const answer = page.getByRole("textbox", { name: "Your explanation" });
  await expect(answer).toBeEnabled({ timeout: 30000 });
  await answer.fill("  My fictional draft  ");
  const send = page.getByRole("button", { name: "Send answer" });
  await send.click();
  await expect(page.getByRole("status")).toContainText("could not confirm");
  await expect(answer).toHaveValue("  My fictional draft  ");
  await send.click();
  await expect(send).toBeEnabled();
  expect(requests[0]).toEqual(requests[1]);
  await answer.fill("My edited fictional draft");
  await send.click();
  await expect(send).toBeEnabled();
  expect(requests[2].idempotency_key).not.toBe(requests[0].idempotency_key);
  failRefresh = true;
  await page.getByRole("button", { name: "Refresh saved session" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Fictional connection failure",
  );
  await expect(
    page.getByText("Your unsent draft is held", { exact: false }),
  ).toBeVisible();
  failRefresh = false;
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(answer).toHaveValue("My edited fictional draft");
  state.session.status = "evaluating";
  await page.getByRole("button", { name: "Refresh saved session" }).click();
  await expect(answer).toBeDisabled();
  await expect(answer).toHaveValue("My edited fictional draft");
});

test("API-mocked tablet and 200% text keep long session content usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  const state = fictionalState();
  state.session.lesson_title = "Fictional " + "LongLessonTitle".repeat(12);
  state.session.objective_labels = ["LongObjective".repeat(20)];
  state.messages = [message(0, "errby", "LongExplanation".repeat(80))];
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.goto(`/learn/sessions/${sessionId}`);
  await expect(
    page.getByRole("heading", { name: state.session.lesson_title }),
  ).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect(
    page.getByRole("textbox", { name: "Your explanation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(768);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});

test("API-mocked failed send: edited draft survives reload with separate retry identity", async ({
  page,
}) => {
  const state = fictionalState();
  const requests: { text: string; idempotency_key: string }[] = [];
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${sessionId}/turns`, (route) => {
    requests.push(route.request().postDataJSON());
    return route.abort("failed");
  });
  await page.goto(`/learn/sessions/${sessionId}`);
  const answer = page.getByRole("textbox", { name: "Your explanation" });
  const send = page.getByRole("button", { name: "Send answer" });
  await answer.fill("Original answer");
  await send.click();
  await expect(send).toBeEnabled();
  await answer.fill("  Original answer  ");
  await page.reload();
  await expect(answer).toHaveValue("  Original answer  ");
  await send.click();
  await expect(send).toBeEnabled();
  expect(requests[1].idempotency_key).toBe(requests[0].idempotency_key);
  await answer.fill("Edited answer");
  await page.reload();
  await expect(answer).toHaveValue("Edited answer");
  await send.click();
  await expect(send).toBeEnabled();
  expect(requests[2].idempotency_key).not.toBe(requests[0].idempotency_key);
});

test("API-mocked ambiguous save: discovering saved A preserves unsent edited B", async ({
  page,
}) => {
  const state = fictionalState();
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${sessionId}/turns`, (route) => {
    state.messages.push(
      message(3, "student", route.request().postDataJSON().text),
    );
    state.session.last_sequence = 3;
    state.session.status = "evaluating";
    return route.abort("failed");
  });
  await page.goto(`/learn/sessions/${sessionId}`);
  const answer = page.getByRole("textbox", { name: "Your explanation" });
  await answer.fill("Answer A");
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect(answer).toBeEnabled();
  await answer.fill("Draft B");
  await page.getByRole("button", { name: "Refresh saved session" }).click();
  await expect(answer).toHaveValue("Draft B");
  await expect(answer).toBeDisabled();
  await expect(page.getByRole("list", { name: "Conversation" })).toContainText(
    "Answer A",
  );
  await page.reload();
  await expect(answer).toHaveValue("Draft B");
});

test("API-mocked AI retry returns transcript and objective progress; pause and resume retain draft", async ({
  page,
}) => {
  const state = {
    ...fictionalState("evaluating"),
    processing_error: {
      code: "provider_unavailable",
      message: "AI response unavailable. Your answer is saved.",
    },
  };
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${sessionId}/process`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({});
    state.session.status = "awaiting_student";
    state.messages.push(
      message(3, "errby", "Can you explain with a different example?"),
    );
    await route.fulfill({
      json: {
        session: {
          ...state.session,
          objective_progress: [
            { id: "heat", label: "Explain heat flow", status: "explained" },
            {
              id: "example",
              label: "Use your own example",
              status: "developing",
            },
          ],
        },
        messages: state.messages,
      },
    });
  });
  await page.route(`**/api/sessions/${sessionId}/pause`, (route) => {
    state.session.status = route.request().postDataJSON().pause
      ? "paused"
      : "awaiting_student";
    return route.fulfill({
      json: { session: state.session, messages: state.messages },
    });
  });
  await page.goto(`/learn/sessions/${sessionId}`);
  await page.getByRole("button", { name: "Retry AI response" }).click();
  await expect(
    page.getByText("Can you explain with a different example?"),
  ).toBeVisible();
  await expect(page.locator(".session-goals-desktop")).toHaveCount(0);
  const answer = page.getByRole("textbox", { name: "Your explanation" });
  await answer.fill("A draft to return to");
  await page.getByRole("button", { name: "Pause session" }).click();
  await expect(answer).toBeDisabled();
  await expect(page.getByRole("status")).toContainText(
    "Session paused and saved.",
  );
  await page.getByRole("button", { name: "Resume session" }).click();
  await expect(answer).toBeEnabled();
  await expect(answer).toHaveValue("A draft to return to");
});

test("API-mocked submitted answer renders the full persisted AI reply and clears its draft", async ({
  page,
}) => {
  const state = fictionalState();
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${sessionId}/turns`, (route) => {
    const saved = message(3, "student", route.request().postDataJSON().text);
    state.session.last_sequence = 4;
    state.messages.push(
      saved,
      message(4, "errby", "How would this change with a wooden spoon?"),
    );
    return route.fulfill({ json: { ...state, message: saved } });
  });
  await page.goto(`/learn/sessions/${sessionId}`);
  const answer = page.getByRole("textbox", { name: "Your explanation" });
  await answer.fill("Heat transfers through the metal.");
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect(
    page.getByText("How would this change with a wooden spoon?"),
  ).toBeVisible();
  await expect(answer).toBeEnabled();
  await expect(answer).toHaveValue("");
  await page.reload();
  await expect(answer).toHaveValue("");
  await expect(
    page.getByRole("list", { name: "Conversation" }).getByRole("listitem"),
  ).toHaveCount(5);
});
