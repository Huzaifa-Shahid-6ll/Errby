import { expect, test } from "@playwright/test";

test("no JavaScript preserves both examples and native menu and FAQ controls", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.locator("header summary").click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.locator("header summary").click();
  await page.locator("main a[href='#example']").first().click();
  const branch = page.locator("#example details");
  await branch.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(branch.getByText(/That idea needs correcting:/)).toBeVisible();
  await expect(branch.getByText(/If you put a cold spoon/)).toBeVisible();
  const faq = page.locator("#questions details").last();
  await faq.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(faq.locator("p")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("greeting interruption, reversal and rollback keep text and targets usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const mascot = page.locator('[data-landing-mascot="greeting"]');
  const cta = page.locator("main .landing-cta").first();
  const bounds = await cta.boundingBox();
  for (const fraction of [0, 0.5, 1]) {
    await mascot.evaluate((element, fraction) => {
      const animation = element.getAnimations()[0];
      if (!animation) throw new Error("Greeting missing");
      animation.pause();
      animation.currentTime =
        Number(animation.effect!.getTiming().duration) * fraction;
    }, fraction);
    await expect(page.locator("#hero-title")).toBeVisible();
    await expect(
      page
        .getByText(
          "No. The energy comes from the warmer surroundings. The ice does not make its own heat.",
          { exact: true },
        )
        .first(),
    ).toBeVisible();
    expect(await cta.boundingBox()).toEqual(bounds);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(mascot).toHaveCSS("transform", "none");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await cta.click();
  await expect(page).toHaveURL(/#example$/);
  const faq = page.locator("#questions details").first();
  await faq.locator("summary").focus();
  for (let index = 0; index < 8; index++) await page.keyboard.press("Space");
  await expect(faq).not.toHaveAttribute("open");
  await expect(faq.locator("p")).not.toBeVisible();
  await expect(faq.locator("summary")).toBeFocused();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .locator("#top")
    .evaluate((element) => element.setAttribute("data-motion", "off"));
  expect(
    await page
      .locator("#top")
      .evaluate((element) => element.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await page.goto("/#questions");
  await expect(page.locator("#questions")).toBeInViewport();
  await page.getByRole("link", { name: "Errby home" }).last().click();
  await page.goBack();
  await expect(page).toHaveURL(/#questions$/);
  await page.reload();
  await expect(page.locator("#questions")).toBeInViewport();
});

test("touch, failed artwork and longer text retain the complete teaching story", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.route("**/_next/image?**", (route) => route.abort());
  await page.goto(baseURL!);
  await page.locator("main .landing-cta").first().tap();
  await expect(page).toHaveURL(/#example$/);
  await page.locator("#example details summary").tap();
  await expect(
    page.locator("#example details").getByText(/That idea needs correcting:/),
  ).toBeVisible();
  await page.locator("#hero-title").evaluate((element) => {
    element.textContent +=
      " A much longer explanation with ExtraordinarilyLongUnbrokenWords";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("delayed artwork does not gate the example action", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/image?**", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#hero-title")).toBeVisible();
    await page.locator("main .landing-cta").first().click();
    await expect(page).toHaveURL(/#example$/);
    await expect(
      page
        .locator("#example")
        .getByText("Why does an ice cube melt in a warm room?", { exact: true })
        .first(),
    ).toBeVisible();
  } finally {
    release();
  }
  await page
    .locator("header img")
    .evaluate((image) => (image as HTMLImageElement).decode());
});
