import { expect, test, type Page } from "@playwright/test";
import type { SessionState } from "../../src/lib/sessions/contracts";

const sessionId = "00000000-0000-4000-8000-000000000301";
const documentId = "00000000-0000-4000-8000-000000000501";
const extractedText = "Fictional unreviewed page text. ".repeat(310);
const document = {
  id: documentId,
  name: "Fictional unreviewed science.pdf",
  kind: "pdf",
  bytes: 1024,
  created_at: "2026-10-01T00:00:00Z",
};
const savedState = (): SessionState => ({
  session: {
    id: sessionId,
    status: "awaiting_student",
    visibility: "private",
    lesson_title: "Fictional unreviewed practice",
    objective_labels: ["Explain heat transfer"],
    objective_progress: [
      { id: "heat", label: "Explain heat transfer", status: "untested" },
    ],
    opened_at: "2026-10-01T00:00:00Z",
    last_sequence: 0,
  },
  messages: [
    {
      id: "opening",
      sequence: 0,
      role: "errby",
      text: "Fictional question: how does a metal spoon become warm?",
      created_at: "2026-10-01T00:00:00Z",
    },
  ],
});

async function mockDocuments(page: Page) {
  await page.route("**/api/documents", (route) =>
    route.fulfill({ json: { documents: [document] } }),
  );
  await page.route(`**/api/documents/${documentId}`, (route) =>
    route.fulfill({
      json: {
        extraction: {
          document_id: documentId,
          kind: "pdf",
          text: extractedText,
          pages: [{ page: 1, text: extractedText }],
          coverage: { total_pages: 1, text_pages: 1, missing_pages: [] },
          warnings: ["Fictional parser response; not reviewed."],
        },
      },
    }),
  );
}

for (const mode of ["full", "excerpt"] as const) {
  test(`saved document preview preserves draft and sends explicit ${mode} source scope`, async ({
    page,
  }) => {
    await mockDocuments(page);
    const requests: Record<string, unknown>[] = [];
    await page.route("**/api/chat", async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 503,
        json: {
          user_message: "Fictional model unavailable; your notes remain.",
        },
      });
    });
    await page.goto("/learn");
    const composer = page.getByRole("textbox", { name: "Message Errby" });
    await composer.fill("Keep my fictional draft while previewing.");
    await page
      .getByRole("button", { name: "Saved documents", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(document.name);
    const more = dialog.getByRole("button", {
      name: `More ways to open ${document.name}`,
    });
    await more.focus();
    await page.keyboard.press("Enter");
    const download = page.getByRole("menuitem", { name: "Download original" });
    await expect(download).toHaveAttribute(
      "href",
      `/api/documents/${documentId}/file`,
    );
    await expect(download).toBeFocused();
    await expect(download).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    await expect(dialog).toBeVisible();
    await page.setViewportSize({ width: 320, height: 800 });
    await page.evaluate(() => {
      window.document.documentElement.style.fontSize = "200%";
    });
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => {
      window.document.documentElement.style.fontSize = "";
    });
    await dialog.getByRole("button", { name: "Preview document" }).click();
    await expect(dialog).not.toBeVisible();
    const preview = page.getByRole("region", { name: "Document preview" });
    await expect(preview).toContainText("saved privately");
    await expect(composer).toHaveValue(
      "Keep my fictional draft while previewing.",
    );
    expect(requests).toHaveLength(0);
    await preview
      .getByRole("button", { name: /full document.*page references/ })
      .click();
    const notes = page.getByRole("textbox", { name: "Paste reference notes" });
    await expect(notes).toHaveValue(extractedText.slice(0, 8000));
    if (mode === "excerpt") {
      await notes.fill(
        "Fictional edited excerpt: energy passes between neighboring particles.",
      );
      await expect(
        page.getByText("Edited excerpt; original page locations not claimed", {
          exact: false,
        }),
      ).toBeVisible();
    }
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(page.locator(".chat-notice")).toContainText(
      "Fictional model unavailable",
    );
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      document_id: documentId,
      source_mode: mode,
      notes: true,
    });
    await expect(notes).toHaveValue(
      mode === "full"
        ? extractedText.slice(0, 8000)
        : "Fictional edited excerpt: energy passes between neighboring particles.",
    );
  });
}

test("saved document removal requires explicit confirmation and explains retained conversation excerpts", async ({
  page,
}) => {
  let deleted = 0;
  await mockDocuments(page);
  await page.route(`**/api/documents/${documentId}`, async (route) => {
    expect(route.request().method()).toBe("DELETE");
    deleted++;
    await route.fulfill({ status: 204 });
  });
  await page.goto("/learn");
  await page
    .getByRole("button", { name: "Saved documents", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Remove original" }).click();
  await expect(dialog).toContainText(
    "Excerpts already used in saved conversations remain",
  );
  expect(deleted).toBe(0);
  await dialog.getByRole("button", { name: "Keep document" }).click();
  await expect(
    dialog.getByRole("button", { name: "Confirm removal" }),
  ).toHaveCount(0);
  expect(deleted).toBe(0);
  await dialog.getByRole("button", { name: "Remove original" }).click();
  await dialog.getByRole("button", { name: "Confirm removal" }).click();
  await expect(dialog).toContainText("No saved documents yet");
  expect(deleted).toBe(1);
});

test("saved source evidence retains exact quotes and simpler wording never submits or assesses the draft", async ({
  page,
}) => {
  const state = savedState();
  let turns = 0;
  let help = 0;
  const quote = "Fictional exact evidence.\nSecond line <em>stays text</em>.";
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${sessionId}/sources`, (route) =>
    route.fulfill({
      json: {
        sources: [
          {
            title: document.name,
            document_id: documentId,
            mode: "full",
            kind: "pdf",
            references: [
              { id: "ref-1", text: quote, index: 3, status: "source_checked" },
            ],
          },
        ],
      },
    }),
  );
  await page.route(`**/api/sessions/${sessionId}/turns`, async (route) => {
    turns++;
    await route.fulfill({
      status: 500,
      json: { user_message: "Unexpected answer submission" },
    });
  });
  await page.route(`**/api/sessions/${sessionId}/help`, async (route) => {
    help++;
    expect(route.request().postDataJSON()).toEqual({ expected_sequence: 0 });
    await route.fulfill({
      json: {
        sequence: 0,
        question: "Fictional simpler question: what warms the spoon?",
      },
    });
  });
  await page.goto(`/learn?session=${sessionId}`);
  const answer = page.getByRole("textbox", { name: "Your explanation" });
  await answer.fill("My fictional unsubmitted explanation.");
  await page.getByRole("button", { name: "Sources", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("blockquote")).toHaveText(quote);
  expect(await dialog.locator("blockquote").textContent()).toBe(quote);
  await expect(dialog.locator("blockquote em")).toHaveCount(0);
  await expect(dialog).toContainText("Page 3");
  await expect(dialog).toContainText("Matched to source; unreviewed");
  await expect(dialog.locator('figure[data-kind="source"] svg')).toHaveCount(1);
  await expect(
    dialog.getByRole("link", { name: "Download private original" }),
  ).toHaveAttribute("href", `/api/documents/${documentId}/file`);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Ask in simpler words" }).click();
  await expect(
    page.getByRole("complementary", { name: "Question in simpler words" }),
  ).toContainText("not an assessment");
  await expect(
    page.getByRole("complementary", { name: "Question in simpler words" }),
  ).toContainText("what warms the spoon?");
  await expect(answer).toHaveValue("My fictional unsubmitted explanation.");
  await expect(
    page.getByRole("list", { name: "Conversation" }).getByRole("listitem"),
  ).toHaveCount(1);
  await expect(page.locator("#session-status")).toContainText("Your turn");
  await expect(page.locator("#session-status")).toContainText(
    "progress are unchanged",
  );
  expect(help).toBe(1);
  expect(turns).toBe(0);
  expect(state.session.objective_progress?.[0].status).toBe("untested");
});

test("stopping an opening stream preserves draft and retry identity without saving partial text", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    const controls = window as typeof window & {
      sent: unknown[];
      finishReply: () => void;
    };
    controls.sent = [];
    window.fetch = async (input, init) => {
      if (input !== "/api/chat") return original(input, init);
      controls.sent.push(JSON.parse(String(init?.body)));
      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          start(controller) {
            const send = (value: unknown) =>
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(value)}\n\n`),
              );
            send({ type: "delta", text: "Fictional incomplete reply" });
            const abort = () =>
              controller.error(
                new DOMException("The request was aborted.", "AbortError"),
              );
            init?.signal?.addEventListener("abort", abort, { once: true });
            controls.finishReply = () => {
              init?.signal?.removeEventListener("abort", abort);
              send({
                type: "result",
                value: { reply: "Fictional confirmed reply." },
              });
              controller.close();
            };
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    };
  });
  await page.goto("/learn");
  const composer = page.getByRole("textbox", { name: "Message Errby" });
  await composer.fill("My fictional opening explanation.");
  await composer.press("Enter");
  await expect(
    page.getByText("Fictional incomplete reply", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop processing" }).click();
  await expect(composer).toBeEnabled();
  await expect(composer).toHaveValue("My fictional opening explanation.");
  await expect(page.locator(".chat-notice")).toContainText(
    "charges may still apply",
  );
  await expect(
    page.getByText("Fictional incomplete reply", { exact: true }),
  ).toHaveCount(0);
  const saved = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("errby:entry:demo")!),
  );
  expect(saved.messages).toEqual([]);
  await composer.press("Enter");
  await expect(
    page.getByText("Fictional incomplete reply", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    (window as typeof window & { finishReply: () => void }).finishReply(),
  );
  await expect(
    page.getByText("Fictional confirmed reply.", { exact: true }),
  ).toBeVisible();
  const sent = await page.evaluate(
    () => (window as typeof window & { sent: unknown[] }).sent,
  );
  expect(sent).toHaveLength(2);
  expect(sent[1]).toEqual(sent[0]);
});

test("stopping a saved answer keeps retry identity and refresh recovers actual saved state", async ({
  page,
}) => {
  const state = savedState();
  await page.route(`**/api/sessions/${sessionId}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.addInitScript(
    ({ sessionId, state }) => {
      const original = window.fetch.bind(window);
      const controls = window as typeof window & { sentTurns: unknown[] };
      controls.sentTurns = [];
      window.fetch = async (input, init) => {
        if (input !== `/api/sessions/${sessionId}/turns`)
          return original(input, init);
        controls.sentTurns.push(JSON.parse(String(init?.body)));
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: "status", message: "Fictional answer saved; checking evidence…" })}\n\n`,
                ),
              );
              init?.signal?.addEventListener(
                "abort",
                () => {
                  if (controls.sentTurns.length === 1) {
                    // A result already queued by the transport may arrive after Stop.
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({ type: "result", value: { ...state, message: state.messages[0] } })}\n\n`,
                      ),
                    );
                    controller.close();
                    return;
                  }
                  controller.error(
                    new DOMException("The request was aborted.", "AbortError"),
                  );
                },
                { once: true },
              );
            },
          }),
          { headers: { "Content-Type": "text/event-stream" } },
        );
      };
    },
    { sessionId, state },
  );
  await page.goto(`/learn?session=${sessionId}`);
  const answer = page.getByRole("textbox", { name: "Your explanation" });
  await answer.fill("Fictional explanation saved during processing.");
  for (let attempt = 0; attempt < 2; attempt++) {
    await page
      .getByRole("button", { name: "Send answer", exact: true })
      .click();
    await expect(page.locator("#session-status")).toContainText(
      "Fictional answer saved",
    );
    await page.getByRole("button", { name: "Stop processing" }).click();
    await expect(answer).toBeEnabled();
    await expect(answer).toHaveValue(
      "Fictional explanation saved during processing.",
    );
    await expect(page.locator("#session-status")).toContainText(
      "Refresh the saved session to check",
    );
  }
  const sent = await page.evaluate(
    () => (window as typeof window & { sentTurns: unknown[] }).sentTurns,
  );
  expect(sent).toHaveLength(2);
  expect(sent[1]).toEqual(sent[0]);
  state.session.status = "evaluating";
  state.session.last_sequence = 1;
  state.messages.push({
    id: "saved-answer",
    sequence: 1,
    role: "student",
    text: "Fictional explanation saved during processing.",
    created_at: "2026-10-01T00:00:01Z",
  });
  await page.getByRole("button", { name: "Refresh saved session" }).click();
  await expect(page.locator("#session-status")).toContainText(
    "Answer saved · not graded",
  );
  await expect(answer).toHaveValue("");
  await expect(answer).toBeDisabled();
  await expect(
    page.getByRole("list", { name: "Conversation" }).getByRole("listitem"),
  ).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Retry AI response" }),
  ).toBeVisible();
});
