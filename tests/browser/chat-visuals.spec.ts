import { expect, test } from "@playwright/test";
import type { LinearVisual } from "../../src/lib/visuals/schema";
import type { SessionState } from "../../src/lib/sessions/contracts";

const sessionId = "00000000-0000-4000-8000-000000000301";
const messageId = "00000000-0000-4000-8000-000000000302";
const graph = (): LinearVisual => ({
  version: 1,
  kind: "linear_graph",
  id: "00000000-0000-4000-8000-000000000303",
  revision: 0,
  title: "Fictional straight-line example",
  caption: "An illustrative example, not measured data or reviewed evidence.",
  slope: 2,
  intercept: 1,
  comparison: null,
});

const savedState = (): SessionState => ({
  session: {
    id: sessionId,
    status: "awaiting_student",
    visibility: "private",
    lesson_title: "Fictional unreviewed line practice",
    objective_labels: ["Describe the relationship"],
    objective_progress: [
      { id: "line", label: "Describe the relationship", status: "untested" },
    ],
    opened_at: "2026-10-01T00:00:00Z",
    last_sequence: 0,
  },
  messages: [
    {
      id: messageId,
      sequence: 0,
      role: "errby",
      text: "What changes when you move the slope?",
      created_at: "2026-10-01T00:00:00Z",
      visual: graph(),
      visual_assistance: true,
    },
  ],
});

test("mocked opening graph uses A2UI, responds locally, restores and updates the same surface", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const requests: {
    current_visual?: LinearVisual;
    visual_request?: boolean;
    history: unknown[];
  }[] = [];
  await page.route("**/api/chat", async (route) => {
    const request = route.request().postDataJSON();
    requests.push(request);
    const visual =
      requests.length === 1
        ? graph()
        : {
            ...request.current_visual,
            revision: 1,
            comparison: { slope: -2, intercept: 1 },
          };
    await route.fulfill({
      contentType: "text/event-stream",
      body: `data: ${JSON.stringify({ type: "status", message: "Preparing a fictional graph…" })}\n\ndata: ${JSON.stringify({ type: "result", value: { reply: "Fictional response: how do these lines compare?", visual } })}\n\n`,
    });
  });
  await page.goto("/learn");
  const composer = page.getByRole("textbox", { name: "Message Errby" });
  await composer.fill("Show y = 2x + 1");
  await page
    .getByRole("button", { name: "Explore a graph", exact: true })
    .click();
  await composer.press("Enter");
  const figure = page.locator(".chat-visual");
  await expect(figure).toHaveCount(1);
  await expect(figure).toContainText("Solid: y = 2x + 1");
  const slider = figure.getByRole("slider", { name: /Slope/ });
  await slider.focus();
  await slider.press("ArrowRight");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("2.5");
  await expect(slider).toBeFocused();
  await expect(figure).toContainText("Solid: y = 2.5x + 1");
  expect(requests).toHaveLength(1);
  expect(requests[0].visual_request).toBe(true);
  await composer.fill("Keep my draft");
  await page.reload();
  await expect(composer).toHaveValue("Keep my draft");
  await expect(slider).toHaveValue("2.5");
  await composer.fill("Show a negative slope too");
  await composer.press("Enter");
  await expect(figure).toHaveAttribute("data-visual-revision", "1");
  await expect(figure).toHaveCount(1);
  await expect(figure).toContainText("Dashed: y = -2x + 1");
  expect(requests[1].current_visual?.slope).toBe(2.5);
  expect(requests[1].history).toHaveLength(2);
  await figure.getByText("View values as a table", { exact: true }).click();
  await expect(figure.getByRole("table")).toBeVisible();
  await figure.getByRole("button", { name: "Expand graph" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("slider", { name: /Slope/ })).toHaveValue(
    "2.5",
  );
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    figure.getByRole("button", { name: "Expand graph" }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("mocked failed or invalid visual update keeps the last graph and draft recoverable", async ({
  page,
}) => {
  let requestCount = 0;
  await page.route("**/api/chat", async (route) => {
    requestCount++;
    if (requestCount === 2)
      return route.fulfill({
        contentType: "text/event-stream",
        body: 'data: {"type":"status","message":"Working…"}\n\n',
      });
    await route.fulfill({
      json: {
        reply: "Fictional illustrative reply",
        visual: requestCount === 1 ? graph() : { ...graph(), slope: 99 },
      },
    });
  });
  await page.goto("/learn");
  const composer = page.getByRole("textbox", { name: "Message Errby" });
  await composer.fill("Show a graph");
  await composer.press("Enter");
  const figure = page.locator(".chat-visual");
  await expect(figure).toHaveCount(1);
  await composer.fill("Change the slope");
  await composer.press("Enter");
  await expect(page.locator(".chat-notice")).toContainText(
    "couldn't be confirmed",
  );
  await expect(composer).toHaveValue("Change the slope");
  await expect(figure).toContainText("Solid: y = 2x + 1");
  await composer.press("Enter");
  await expect(composer).toHaveValue("");
  await expect(figure).toHaveCount(1);
  await expect(figure).toContainText("Solid: y = 2x + 1");
});

test("mocked saved graph saves only on deliberate action and reloads accepted settings", async ({
  page,
}) => {
  const state = savedState();
  let saveRequests = 0;
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${sessionId}/visual`, async (route) => {
    saveRequests++;
    const body = route.request().postDataJSON();
    expect(body.message_id).toBe(messageId);
    state.messages[0].visual = {
      ...body.visual,
      revision: body.visual.revision + 1,
    };
    await route.fulfill({ json: { visual: state.messages[0].visual } });
  });
  await page.goto(`/learn?session=${sessionId}`);
  const figure = page.locator(".chat-visual");
  const slider = figure.getByRole("slider", { name: /Slope/ });
  await slider.focus();
  await slider.press("ArrowLeft");
  await expect(slider).toHaveValue("1.75");
  expect(saveRequests).toBe(0);
  const composer = page.getByRole("textbox", { name: "Your explanation" });
  await composer.fill("Unsent fictional explanation");
  await page
    .getByRole("button", { name: "Save graph settings", exact: true })
    .click();
  await expect(page.locator("#session-status")).toContainText(
    "Graph settings saved",
  );
  expect(saveRequests).toBe(1);
  await expect(composer).toHaveValue("Unsent fictional explanation");
  await page.reload();
  await expect(slider).toHaveValue("1.75");
  await expect(figure).toHaveAttribute("data-visual-revision", "1");
  await expect(composer).toHaveValue("Unsent fictional explanation");
  expect(state.session.objective_progress?.[0].status).toBe("untested");
});

test("mocked saved graph followup sends assistance intent and selected state, while stale saves keep local changes", async ({
  page,
}) => {
  const state = savedState();
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${sessionId}/visual`, (route) =>
    route.fulfill({
      status: 409,
      json: {
        user_message:
          "This graph changed in another tab. Refresh the saved session.",
      },
    }),
  );
  let submitted:
    { visual_request: boolean; current_visual: LinearVisual } | undefined;
  await page.route(`**/api/sessions/${sessionId}/turns`, async (route) => {
    submitted = route.request().postDataJSON();
    state.messages[0].visual = {
      ...submitted!.current_visual,
      revision: 1,
      comparison: { slope: -1, intercept: 0 },
    };
    state.session.last_sequence = 2;
    const message = {
      id: "mock-student",
      role: "student" as const,
      sequence: 1,
      text: "Compare a negative slope",
      created_at: "2026-10-01T00:00:01Z",
    };
    state.messages.push(message, {
      id: "mock-reply",
      role: "errby",
      sequence: 2,
      text: "Fictional visual assistance: what changed?",
      visual_assistance: true,
      created_at: "2026-10-01T00:00:02Z",
    });
    await route.fulfill({ json: { ...state, message } });
  });
  await page.goto(`/learn?session=${sessionId}`);
  const slider = page
    .locator(".chat-visual")
    .getByRole("slider", { name: /Slope/ });
  await slider.focus();
  await slider.press("ArrowRight");
  await page.getByRole("button", { name: "Save graph settings" }).click();
  await expect(page.locator("#session-status")).toContainText("another tab");
  await expect(slider).toHaveValue("2.25");
  await page.getByRole("button", { name: "Explore a graph" }).click();
  await page
    .getByRole("textbox", { name: "Describe your graph" })
    .fill("Compare a negative slope");
  await page.getByRole("button", { name: "Send graph request" }).click();
  await expect(page.locator(".chat-visual")).toHaveAttribute(
    "data-visual-revision",
    "1",
  );
  await expect(page.locator(".chat-visual")).toHaveCount(1);
  expect(submitted?.visual_request).toBe(true);
  expect(submitted?.current_visual.slope).toBe(2.25);
  await expect(
    page.getByRole("textbox", { name: "Your explanation" }),
  ).toHaveValue("");
});

test("opening graph survives the local history limit when its original message is evicted", async ({
  page,
}) => {
  await page.addInitScript((visual) => {
    if (sessionStorage.getItem("errby:entry:demo")) return;
    sessionStorage.setItem(
      "errby:entry:demo",
      JSON.stringify({
        messages: Array.from({ length: 40 }, (_, index) => ({
          role: index % 2 ? "student" : "errby",
          text: `Fictional old message ${index}`,
          ...(index === 0 ? { visual } : {}),
        })),
        text: "",
        notes: false,
      }),
    );
  }, graph());
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      json: {
        reply: "Fictional graph updated",
        visual: { ...graph(), revision: 1, slope: -2 },
      },
    }),
  );
  await page.goto("/learn");
  const input = page.getByRole("textbox", { name: "Message Errby" });
  await input.fill("Make this negative");
  await input.press("Enter");
  await expect(page.locator(".chat-visual")).toHaveCount(1);
  await expect(page.locator(".chat-visual")).toHaveAttribute(
    "data-visual-revision",
    "1",
  );
  await page.reload();
  await expect(page.locator(".chat-visual")).toContainText(
    "Solid: y = -2x + 1",
  );
});

test("unconfirmed graph request restores its mode, selected controls and retry key after reload", async ({
  page,
}) => {
  const state = savedState();
  const requests: Record<string, unknown>[] = [];
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${sessionId}/turns`, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 503,
      json: {
        user_message:
          "Fictional unavailable response. Your request is unconfirmed.",
      },
    });
  });
  await page.goto(`/learn?session=${sessionId}`);
  const slope = page
    .locator(".chat-visual")
    .getByRole("slider", { name: /Slope/ });
  await slope.focus();
  await slope.press("ArrowRight");
  await page.getByRole("button", { name: "Explore a graph" }).click();
  await page
    .getByRole("textbox", { name: "Describe your graph" })
    .fill("Compare these slopes");
  await page.getByRole("button", { name: "Send graph request" }).click();
  await expect(page.locator("#session-status")).toContainText("unconfirmed");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Describe your graph" }),
  ).toHaveValue("Compare these slopes");
  await expect(slope).toHaveValue("2.25");
  await page.getByRole("button", { name: "Send graph request" }).click();
  await expect(page.locator("#session-status")).toContainText("unconfirmed");
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual(requests[0]);
});
