import { expect, test } from "@playwright/test";

test("saved history searches message text beyond recent chats, pages, recovers and preserves draft", async ({
  page,
}) => {
  const id = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  let fail = false;
  await page.route("**/api/sessions/search?**", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const query = params.get("q");
    const offset = Number(params.get("offset"));
    const items = query
      ? query === "hidden older message"
        ? [
            {
              id: id(25),
              title: "Fictional older chat",
              openedAt: "2026-09-01T00:00:00Z",
            },
          ]
        : []
      : Array.from({ length: offset ? 5 : 20 }, (_, n) => ({
          id: id(n + offset + 1),
          title: `Fictional conversation ${n + offset + 1}`,
          openedAt: "2026-10-01T00:00:00Z",
        }));
    await route.fulfill({
      status: fail ? 503 : 200,
      json: fail
        ? { error: "Saved chats could not be loaded. Please retry." }
        : { items, nextOffset: query || offset ? null : 20 },
    });
  });
  await page.goto("/learn");
  const draft = page.getByRole("textbox", { name: "Message Errby" });
  await draft.fill("My fictional unsent explanation");
  const trigger = page.getByRole("button", { name: "Search saved chats" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link")).toHaveCount(20);
  await dialog.getByRole("button", { name: "Load older chats" }).click();
  await expect(dialog.getByRole("link")).toHaveCount(25);
  await dialog.getByLabel("Find in conversations").fill("hidden older message");
  await dialog.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    dialog.getByRole("link", { name: /Fictional older chat/ }),
  ).toHaveAttribute("href", `/learn?session=${id(25)}`);
  await expect(dialog.getByRole("link")).toHaveCount(1);
  fail = true;
  await dialog.getByRole("button", { name: "Search", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Please retry");
  fail = false;
  await dialog.getByLabel("Find in conversations").fill("unmatched");
  await dialog.getByRole("button", { name: "Search", exact: true }).click();
  await expect(dialog.getByRole("status")).toHaveText(
    "No saved conversations found.",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(draft).toHaveValue("My fictional unsent explanation");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
