import { expect, test } from "@playwright/test";

test("concept navigation, corrections and disclosures stay local and keyboard accessible", async ({
  page,
}) => {
  const errors: string[] = [];
  const mutations: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.method() !== "GET") mutations.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Learn it by teaching Errby.",
  );
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.locator("main a[href='#example']").first().click();
  await expect(page).toHaveURL(/#example$/);
  const branch = page.locator("#example details");
  await branch.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(branch).toHaveAttribute("open", "");
  await expect(
    branch.getByText("Yes, the ice makes heat to melt.", { exact: true }),
  ).toBeVisible();
  await expect(branch.getByText(/That idea needs correcting:/)).toBeVisible();
  await expect(branch.locator("summary")).toBeFocused();
  const faq = page.locator("#questions details").first();
  await faq.locator("summary").focus();
  await page.keyboard.press("Space");
  await expect(faq.locator("p")).toBeVisible();
  expect(await page.locator("main").getByRole("textbox").count()).toBe(0);
  expect(
    await page
      .locator("a[href^='#']")
      .evaluateAll((links) =>
        links.every(
          (link) =>
            !!document.getElementById(
              (link as HTMLAnchorElement).hash.slice(1),
            ),
        ),
      ),
  ).toBe(true);
  expect(mutations).toEqual([]);
  expect(errors).toEqual([]);
});

test("mobile menu dismisses with Escape and sends focus to its destination", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.locator("header details");
  const summary = menu.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("open", "");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open");
  await expect(summary).toBeFocused();
  await summary.click();
  await menu.getByRole("link", { name: "Your notes" }).click();
  await expect(menu).not.toHaveAttribute("open");
  await expect(page.locator("#sources-title")).toBeFocused();
  await expect(page).toHaveURL(/#sources-title$/);
});

test("responsive concept stays light with enlarged text, reduced motion and saved dark preference", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("errby-theme", "dark"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1440 || width === 390) {
      await page.screenshot({
        path: `test-results/landing-${width}-${test.info().project.name}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator("#top")).toHaveCSS(
    "background-color",
    "rgb(247, 249, 252)",
  );
  expect(
    await page
      .locator("#top")
      .evaluate((root) => root.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await page.emulateMedia({ forcedColors: "active" });
  const cta = page.locator("main a[href='#example']").first();
  await cta.focus();
  expect(
    await cta.evaluate((element) => getComputedStyle(element).outlineStyle),
  ).not.toBe("none");
});
