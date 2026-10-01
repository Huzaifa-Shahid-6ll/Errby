import { expect, test } from "@playwright/test";

for (const preference of ["system", "manual"] as const) {
  test(`shared dialogs respect ${preference} reduced motion and restore focus`, async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: preference === "system" ? "reduce" : "no-preference",
    });
    if (preference === "manual")
      await page.addInitScript(() =>
        localStorage.setItem("errby-pause-motion", "true"),
      );
    await page.route("**/api/sessions/search?**", (route) =>
      route.fulfill({ json: { items: [], nextOffset: null } }),
    );
    await page.goto("/learn");
    const trigger = page.getByRole("button", { name: "Search saved chats" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const panels = page.locator(
      '[data-slot="dialog-content"], [data-slot="dialog-overlay"]',
    );
    await expect(panels).toHaveCount(2);
    for (const panel of await panels.all()) {
      await expect(panel).toHaveCSS("filter", "none");
      expect(
        await panel.evaluate(
          (element) =>
            element
              .getAnimations()
              .filter((animation) => animation.playState === "running").length,
        ),
      ).toBe(0);
    }
    await expect(dialog).toHaveCSS("transform", "none");
    const close = await dialog
      .getByRole("button", { name: "Close", exact: true })
      .boundingBox();
    expect(close?.width).toBeGreaterThanOrEqual(44);
    expect(close?.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}
