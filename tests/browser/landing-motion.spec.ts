import { expect, test } from "@playwright/test";

test("motion never gates the transcript or conversion, including interrupted playback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const cta = page.locator("main .landing-cta").first();
  const restingTarget = await cta.boundingBox();
  const mascot = page.locator("#example [data-landing-mascot]");
  for (const progress of [0, 0.5, 1]) {
    await mascot.evaluate((element, progress) => {
      const animation = element.getAnimations()[0];
      if (!animation) throw new Error("Greeting animation missing");
      animation.pause();
      animation.currentTime =
        Number(animation.effect!.getTiming().duration) * progress;
    }, progress);
    await expect(page.locator("#hero-title")).toBeVisible();
    await expect(page.locator("#example li")).toHaveCount(4);
    await expect(
      page.getByText("No. The energy comes from the warmer surroundings.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(await cta.boundingBox()).toEqual(restingTarget);
  }
  await mascot.evaluate((element) => {
    const animation = element.getAnimations()[0];
    animation.currentTime = Number(animation.effect!.getTiming().duration) / 2;
    animation.play();
  });
  await cta.click();
  await expect(page).toHaveURL(/#example$/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page
        .locator(".landing-page")
        .evaluate((element) => element.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await expect(mascot).toHaveCSS("transform", "none");
});

test("native disclosure reverses rapidly and keyboard focus remains visible", async ({
  page,
}) => {
  await page.goto("/#questions");
  const details = page.locator("#questions details").first();
  const summary = details.locator("summary");
  await summary.focus();
  for (let index = 0; index < 7; index++) await page.keyboard.press("Space");
  await expect(details).not.toHaveAttribute("open");
  await expect(details.locator("p")).not.toBeVisible();
  await expect(summary).toBeFocused();
  expect(
    await summary.evaluate((element) => getComputedStyle(element).outlineStyle),
  ).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await expect(details.locator("p")).toBeVisible();
  await page.getByRole("link", { name: "Errby home" }).last().click();
  await expect(page).toHaveURL(/#top$/);
  await page.goBack();
  await expect(page).toHaveURL(/#questions$/);
  await page.reload();
  await expect(page.locator("#questions")).toBeInViewport();
  await expect(page.locator("#example li")).toHaveCount(4);
});

test("motion scales across sizes, enlarged text and forced colors without moving targets", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [320, 390, 768, 1440, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await expect(page.locator("#hero-title")).toBeVisible();
    await expect(page.locator("#example li")).toHaveCount(4);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: "html {font-size:200%!important}" });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const cta = page.locator("main .landing-cta").first();
  await cta.focus();
  await expect(cta).toBeFocused();
  expect(
    await cta.evaluate((element) => getComputedStyle(element).outlineStyle),
  ).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#example$/);
});

test("no JavaScript and failed images preserve the complete teaching story and native controls", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.route("**/_next/image?**", (route) => route.abort());
  await page.goto(baseURL!);
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator("#example li")).toHaveCount(4);
  await page.locator("main .landing-cta").first().click();
  await expect(page).toHaveURL(/#example$/);
  const details = page.locator("#questions details").first();
  await details.locator("summary").focus();
  await page.keyboard.press("Space");
  await expect(details).not.toHaveAttribute("open");
  await page.keyboard.press("Space");
  await expect(details.locator("p")).toBeVisible();
  await context.close();
});

test("touch, longer copy, rollback and theme reload preserve usable final states", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseURL!);
  const cta = page.locator("main .landing-cta").first();
  await cta.tap();
  await expect(page).toHaveURL(/#example$/);
  await page
    .locator("#example li")
    .last()
    .locator("p")
    .last()
    .evaluate((element) => {
      element.textContent +=
        " Here is a much longer fictional explanation with additional words to test wrapping and natural content height. ".repeat(
          5,
        );
    });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page
    .locator(".landing-page")
    .evaluate((element) => element.setAttribute("data-motion", "off"));
  await expect
    .poll(() =>
      page
        .locator(".landing-page")
        .evaluate((element) => element.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
  await page.getByRole("button", { name: "Use dark theme" }).tap();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("button", { name: "Use light theme" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use light theme" }).tap();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  expect(errors).toEqual([]);
  await context.close();
});
