import { expect, test } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000300";
const explanation =
  "Fictional reference: warmth moves to cooler objects.\nExplain why.\nRead https://example.com/notes?q=heat&part=1.\nAlso https://example.com/topic_(test).\nLiteral <img src=x onerror=alert(1)> javascript:alert(1) data:text/html,bad https://person:secret@example.com/private https://";

for (const saved of [false, true]) {
  test(`mocked ${saved ? "saved" : "opening"} conversation copies exact text and offers an accessible jump to latest`, async ({
    page,
  }) => {
    let needsReview = false;
    await page.addInitScript(
      ({ saved, explanation }) => {
        const controls = window as typeof window & {
          copied: string;
          rejectCopy: boolean;
        };
        controls.copied = "";
        controls.rejectCopy = false;
        Object.defineProperty(navigator, "clipboard", {
          value: {
            writeText: async (text: string) => {
              if (controls.rejectCopy) throw new Error("Clipboard denied");
              controls.copied = text;
            },
          },
          configurable: true,
        });
        if (!saved)
          sessionStorage.setItem(
            "errby:entry:demo",
            JSON.stringify({
              messages: [
                { role: "errby", text: explanation },
                {
                  role: "student",
                  text: "A fictional explanation.\n".repeat(80),
                },
              ],
              text: "Unsent draft",
              notes: false,
            }),
          );
      },
      { saved, explanation },
    );
    if (saved)
      await page.route(`**/api/sessions/${id}`, (route) =>
        route.fulfill({
          json: {
            session: {
              id,
              status: needsReview ? "needs_review" : "awaiting_student",
              visibility: "private",
              lesson_title: "Fictional practice",
              objective_labels: [],
              last_sequence: 1,
              opened_at: "2026-10-01T00:00:00Z",
            },
            messages: [
              {
                id: "first",
                sequence: 0,
                role: "supervisor",
                text: explanation,
                created_at: "2026-10-01T00:00:00Z",
              },
              {
                id: "second",
                sequence: 1,
                role: "student",
                text: "A fictional explanation.\n".repeat(80),
                created_at: "2026-10-01T00:00:00Z",
              },
            ],
          },
        }),
      );
    await page.goto(saved ? `/learn?session=${id}` : "/learn");
    const input = page.getByRole("textbox", {
      name: saved ? "Your explanation" : "Message Errby",
    });
    await expect(input).toBeEnabled();
    await input.fill("Unsent draft");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const latest = page.getByRole("button", { name: "Latest message" });
    await expect(latest).toBeInViewport();
    const copy = page.getByRole("button", {
      name: "Copy Errby message",
      exact: true,
    });
    const message = copy.locator("xpath=ancestor::li[1]");
    await expect(message.locator("a.chat-web-link")).toHaveCount(2);
    await expect(message.locator("a.chat-web-link").first()).toHaveAttribute(
      "href",
      "https://example.com/notes?q=heat&part=1",
    );
    await expect(message.locator("a.chat-web-link").last()).toHaveAttribute(
      "href",
      "https://example.com/topic_(test)",
    );
    await expect(message.locator("a.chat-web-link").first()).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    await expect(message.locator("a.chat-web-link svg")).toHaveCount(2);
    await expect(message.locator(".chat-message-text img")).toHaveCount(0);
    if (saved)
      await expect(
        message.locator('.chat-content-card[data-kind="guidance"]'),
      ).toContainText("Learning guidance");
    const beforeCopy = await copy.boundingBox();
    await copy.click();
    expect(
      await page.evaluate(
        () => (window as typeof window & { copied: string }).copied,
      ),
    ).toBe(explanation);
    await expect(page.getByText("Copied", { exact: true })).toBeVisible();
    await expect(copy).toHaveAttribute("data-state", "copied");
    expect((await copy.boundingBox())?.width).toBe(beforeCopy?.width);
    await page.evaluate(() => {
      (window as typeof window & { rejectCopy: boolean }).rejectCopy = true;
    });
    await copy.click();
    await expect(
      page.getByText("Could not copy. Select the message text to copy it."),
    ).toBeVisible();
    await expect(copy).toHaveAttribute("data-state", "error");
    expect((await copy.boundingBox())?.width).toBe(beforeCopy?.width);
    await latest.click();
    await expect(latest).toHaveCount(0);
    await expect(input).toHaveValue("Unsent draft");
    if (saved) {
      await expect(
        page.getByRole("link", { name: "View learning evidence" }),
      ).toHaveAttribute("href", `/learn/sessions/${id}/results`);
      await expect(page.locator(".session-supervisor")).toHaveCount(0);
      needsReview = true;
      await page.getByRole("button", { name: "Refresh saved session" }).click();
      await expect(page.getByRole("status")).toContainText(
        "Needs review · unresolved",
      );
      await expect(
        page.getByRole("link", {
          name: "return to chat with clearer reference notes",
        }),
      ).toHaveAttribute("href", "/learn");
      await expect(input).toBeDisabled();
      await expect(input).toHaveValue("Unsent draft");
      await expect(
        page.getByRole("button", { name: "Copy Errby message", exact: true }),
      ).toHaveCount(1);
    }
  });
}
