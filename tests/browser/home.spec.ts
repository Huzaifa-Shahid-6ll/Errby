import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000300";
test("direct chat entry has no teacher or preparation screens and demo fails honestly", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/learn");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "What can you teach me?",
  );
  const composer = page.getByRole("textbox", { name: "Message Errby" });
  await expect(composer).toBeEnabled();
  await expect(
    page.getByRole("link", { name: /class|teacher|prepare|lesson/i }),
  ).toHaveCount(0);
  await composer.fill("Hi Errby");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("fictional preview");
  await expect(composer).toHaveValue("Hi Errby");
  await page.reload();
  await expect(composer).toHaveValue("Hi Errby");
  await page.getByRole("button", { name: "New chat" }).click();
  await expect(composer).toHaveValue("");
  for (const route of [
    "/classes",
    "/prepare",
    "/api/classes",
    "/api/preparations",
    "/prepare/extract",
  ])
    expect((await request.get(route)).status()).toBe(404);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("mocked stream renders early text, removes interrupted replies and reuses the draft key", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    const controls = window as typeof window & {
      finishReply: (fail?: boolean) => void;
      sent: unknown[];
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
            send({ type: "status", message: "Errby is thinking…" });
            send({ type: "delta", text: "Why does the ice" });
            controls.finishReply = (fail = false) => {
              if (!fail) {
                send({ type: "delta", text: " melt?" });
                send({
                  type: "result",
                  value: { reply: "Why does the ice melt?" },
                });
              }
              controller.close();
            };
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      );
    };
  });
  await page.goto("/learn");
  const input = page.getByRole("textbox", { name: "Message Errby" });
  await input.fill("Ice melts in warm water.");
  await input.press("Enter");
  await expect(
    page.getByText("Why does the ice", { exact: true }),
  ).toBeVisible();
  await expect(input).toBeDisabled();
  const orb = page.locator('.learning-orb[data-state="composing"]');
  await expect(orb).toHaveAttribute("data-paused", "false");
  await page
    .getByRole("button", { name: "Pause animations", exact: true })
    .click();
  await expect(orb).toHaveAttribute("data-paused", "true");
  await expect(
    page.getByText("Why does the ice", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Resume animations", exact: true })
    .click();
  await expect(orb).toHaveAttribute("data-paused", "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(orb).toHaveAttribute("data-paused", "true");
  await expect(
    page.getByRole("button", { name: "Reduced motion enabled" }),
  ).toBeDisabled();
  await page.evaluate(() =>
    (
      window as typeof window & { finishReply: (fail: boolean) => void }
    ).finishReply(true),
  );
  await expect(page.getByRole("status")).toContainText("couldn't be confirmed");
  await expect(page.getByText("Why does the ice", { exact: true })).toHaveCount(
    0,
  );
  await expect(input).toHaveValue("Ice melts in warm water.");
  await input.press("Enter");
  await expect(
    page.getByText("Why does the ice", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() =>
    (window as typeof window & { finishReply: () => void }).finishReply(),
  );
  await expect(
    page.getByText("Why does the ice melt?", { exact: true }),
  ).toBeVisible();
  await expect(input).toHaveValue("");
  const sent = await page.evaluate(
    () => (window as typeof window & { sent: unknown[] }).sent,
  );
  expect(sent[1]).toEqual(sent[0]);
});

test("motion preference persists and GPU fallback preserves the composer", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    const checks = window as typeof window & { gpuChecks: number };
    checks.gpuChecks = 0;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) {
        checks.gpuChecks += 1;
        return null;
      }
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () => {
        throw new Error(
          "Decorative effects must not request microphone access",
        );
      },
    });
  });
  await page.goto("/learn");
  const composer = page.getByRole("textbox", { name: "Message Errby" });
  await composer.fill("Draft with no GPU.");
  await page.getByRole("button", { name: "Animate Errby" }).click();
  await page.waitForFunction(
    () => (window as typeof window & { gpuChecks: number }).gpuChecks > 0,
  );
  await expect(composer).toBeEnabled();
  await expect(page.locator(".welcome-art img")).toBeVisible();
  await page
    .getByRole("button", { name: "Pause animations", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume animations", exact: true }),
  ).toBeVisible();
  await expect(composer).toHaveValue("Draft with no GPU.");
  await page.getByRole("button", { name: "Send message", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("fictional preview");
  await expect(composer).toHaveValue("Draft with no GPU.");
});

test("mascot image reveal finishes and can be replayed without losing the draft", async ({
  page,
}) => {
  // Two cold shader compilations on the local software renderer exceed 30s.
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/learn");
  const input = page.getByRole("textbox", { name: "Message Errby" });
  await input.fill("Keep this fictional draft.");
  // Observe the finite effect before clicking: software GPU compilation can
  // finish its whole reveal before Playwright's next visibility poll.
  await page.evaluate(() => {
    const controls = window as typeof window & { reveals: number };
    controls.reveals = 0;
    new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) {
          if (
            node instanceof Element &&
            (node.matches(".welcome-reveal") ||
              node.querySelector(".welcome-reveal"))
          )
            controls.reveals += 1;
        }
    }).observe(document.querySelector(".welcome-art")!, {
      childList: true,
      subtree: true,
    });
  });
  const mascot = page.getByRole("button", { name: "Animate Errby" });
  await mascot.click();
  await page.waitForFunction(
    () => (window as typeof window & { reveals: number }).reveals === 1,
  );
  await expect(page.locator(".welcome-reveal")).toHaveCount(0, {
    timeout: 15000,
  });
  await mascot.click();
  await page.waitForFunction(
    () => (window as typeof window & { reveals: number }).reveals === 2,
  );
  await page
    .getByRole("button", { name: "Pause animations", exact: true })
    .click();
  await expect(page.locator(".welcome-reveal")).toHaveCount(0);
  await expect(input).toHaveValue("Keep this fictional draft.");
  expect(errors).toEqual([]);
});

test("attachment preview preserves drafts, exposes missing coverage and supports notes plus theme and zoom", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/chat/attachment", async (route) => {
    await gate;
    await route.fulfill({
      json: {
        extraction: {
          text: "[Page 1]\nHeat moves from warmer objects to colder objects.",
          coverage: { text_pages: 1, total_pages: 2, missing_pages: [2] },
          warnings: [
            "Page 2 has no extractable text. Review coverage before continuing.",
          ],
        },
      },
    });
  });
  await page.goto("/learn");
  const input = page.getByRole("textbox", { name: "Message Errby" });
  await input.fill("Keep this draft while I look at the file.");
  await page.locator('input[type="file"]').setInputFiles({
    name: "fictional-heat.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("synthetic upload; parser is mocked"),
  });
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send message", exact: true }),
  ).toBeDisabled();
  release();
  await expect(
    page.getByRole("region", { name: "Document preview" }),
  ).toContainText("1 of 2");
  await expect(
    page.getByText("Page 2 has no extractable text.", { exact: false }),
  ).toBeVisible();
  await expect(input).toHaveValue("Keep this draft while I look at the file.");
  await page
    .getByRole("button", { name: "Replace draft with extracted notes" })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Paste reference notes" }),
  ).toHaveValue(/Heat moves/);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Paste reference notes" }),
  ).toHaveValue(/Heat moves/);
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("attachment limits and real demo rejection leave the draft intact", async ({
  page,
}) => {
  await page.goto("/learn");
  const input = page.getByRole("textbox", { name: "Message Errby" });
  await input.fill("My unsent draft.");
  const file = page.locator('input[type="file"]');
  await file.setInputFiles({
    name: "scan.png",
    mimeType: "image/png",
    buffer: Buffer.from("synthetic"),
  });
  await expect(page.getByRole("status")).toContainText(
    "PDF or DOCX up to 4 MiB",
  );
  await file.setInputFiles({
    name: "large.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(4 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole("status")).toContainText(
    "PDF or DOCX up to 4 MiB",
  );
  await file.setInputFiles({
    name: "fictional.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("synthetic"),
  });
  await expect(page.getByRole("status")).toContainText(
    "Personal uploads require a signed-in account",
  );
  await expect(input).toHaveValue("My unsent draft.");
});

test("mocked natural chat preserves retry identity, edited drafts and same-screen notes handoff", async ({
  page,
}) => {
  const requests: { key: string; text: string; notes: boolean }[] = [];
  let fail = true;
  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    if (fail) return route.abort();
    return route.fulfill({
      json: body.notes
        ? { session_id: id }
        : { reply: "What makes the ice melt?" },
    });
  });
  await page.route(`**/api/sessions/${id}`, (route) =>
    route.fulfill({
      json: {
        session: {
          id,
          status: "awaiting_student",
          visibility: "private",
          lesson_title: "Fictional heat transfer",
          objective_labels: ["Heat transfer"],
          last_sequence: 0,
          opened_at: "2026-09-30T00:00:00Z",
        },
        messages: [
          {
            id,
            sequence: 0,
            role: "errby",
            text: "Can you explain where the energy comes from?",
            created_at: "2026-09-30T00:00:00Z",
          },
        ],
      },
    }),
  );
  await page.goto("/learn");
  const composer = page.getByRole("textbox", { name: "Message Errby" });
  await composer.fill("I'd like to teach you heat transfer.");
  await composer.press("Enter");
  await expect(page.getByRole("status")).toContainText("couldn't be confirmed");
  await composer.press("Enter");
  await expect(composer).toBeEnabled();
  expect(requests[1]).toEqual(requests[0]);
  await composer.fill("I want to explain why ice melts.");
  fail = false;
  await composer.press("Enter");
  await expect(
    page.getByText("What makes the ice melt?", { exact: true }),
  ).toBeVisible();
  expect(requests[2].key).not.toBe(requests[0].key);
  await page.getByRole("button", { name: "Paste notes" }).click();
  await page
    .getByRole("textbox", { name: "Paste reference notes" })
    .fill("Heat transfers from warmer surroundings to colder ice.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/learn\\?session=${id}`));
  await expect(
    page.getByRole("list", { name: "Opening conversation" }),
  ).toContainText("I want to explain why ice melts.");
  await expect(
    page.getByRole("textbox", { name: "Your explanation" }),
  ).toBeEnabled();
  await expect(
    page.getByText("Can you explain where the energy comes from?"),
  ).toBeVisible();
  await expect(
    page.locator(".session-goals-desktop, .session-goals-mobile"),
  ).toHaveCount(0);
});
