import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  recordVideo: {
    dir: "docs/animation/evidence/video",
    size: { width: 1366, height: 768 },
  },
});
const page = await context.newPage();
const observations = {
  browser: browser.version(),
  date: new Date().toISOString(),
  frames: [],
  console: [],
  networkFailures: [],
};
page.on("pageerror", (e) => observations.console.push(e.message));
page.on("requestfailed", (request) =>
  observations.networkFailures.push({
    url: request.url(),
    failure: request.failure(),
  }),
);
await page.goto(process.env.MOTION_URL || "http://127.0.0.1:3001");
await page.evaluate(() => document.fonts.ready);
const mascot = page.locator("#example [data-landing-mascot]");
for (const theme of ["light", "dark"]) {
  if (theme === "dark")
    await page.getByRole("button", { name: "Use dark theme" }).click();
  for (const progress of [0, 0.5, 1]) {
    const state = await mascot.evaluate((el, p) => {
      const a = el.getAnimations()[0];
      a.pause();
      a.currentTime = Number(a.effect.getTiming().duration) * p;
      return {
        progress: p,
        time: a.currentTime,
        transform: getComputedStyle(el).transform,
        opacity: getComputedStyle(el).opacity,
      };
    }, progress);
    observations.frames.push({ theme, ...state });
    await page.screenshot({
      path: `docs/animation/evidence/${theme}-${progress === 0 ? "start" : progress === 1 ? "end" : "middle"}.png`,
      animations: "allow",
    });
  }
}
await page.getByRole("button", { name: "Use light theme" }).click();
// Replay the actual CSS animation at quarter speed for a temporal review window.
await mascot.evaluate((el) => {
  const a = el.getAnimations()[0];
  a.playbackRate = 0.25;
  a.currentTime = 0;
  a.play();
});
for (let i = 0; i < 7; i++) {
  observations.frames.push(
    await mascot.evaluate((el) => ({
      time: performance.now(),
      animationTime: el.getAnimations()[0]?.currentTime,
      transform: getComputedStyle(el).transform,
    })),
  );
  await page.waitForTimeout(120); // Deliberate temporal sampling, not an assertion delay.
}
await page.emulateMedia({ reducedMotion: "reduce" });
observations.interrupted = await mascot.evaluate((el) => ({
  transform: getComputedStyle(el).transform,
  animations: el.getAnimations().length,
}));
await page.screenshot({
  path: "docs/animation/evidence/reduced-interrupted.png",
  animations: "allow",
});
await page.emulateMedia({ reducedMotion: "no-preference" });
const cta = page.locator("main .landing-cta").first();
await cta.hover();
await page.waitForTimeout(70);
const bounds = await cta.boundingBox();
await page.mouse.down();
observations.pressed = await cta.evaluate((el) => ({
  translate: getComputedStyle(el).translate,
  transform: getComputedStyle(el).transform,
  rect: el.getBoundingClientRect().toJSON(),
}));
await page.mouse.up();
await page.mouse.move(1, 1);
observations.hoverTarget = bounds;
const question = page.locator("#questions summary").first();
await question.click();
await question.click();
await question.click();
await question.click();
await page.mouse.wheel(0, 3000);
await page.mouse.wheel(0, -3000);
await page.setViewportSize({ width: 390, height: 844 });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.getByRole("button", { name: "Use dark theme" }).click();
await page.screenshot({
  path: "docs/animation/evidence/phone-dark-reduced.png",
  fullPage: true,
});
const cdp = await context.newCDPSession(page);
await cdp.send("Page.setWebLifecycleState", { state: "frozen" });
await cdp.send("Page.setWebLifecycleState", { state: "active" });
observations.lifecycle = {
  method: "CDP frozen→active; not a physical background-tab test",
  headline: await page.locator("#hero-title").innerText(),
};
const video = page.video();
await context.close();
observations.video = await video.path();
// Delayed images: observe complete semantic content before image responses finish.
const slow = await browser.newContext({
  viewport: { width: 768, height: 900 },
});
const slowPage = await slow.newPage();
await slowPage.route("**/_next/image?**", async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await route.continue();
});
await slowPage.goto(process.env.MOTION_URL || "http://127.0.0.1:3001", {
  waitUntil: "domcontentloaded",
});
observations.slowImages = {
  delayMs: 1500,
  headline: await slowPage.locator("#hero-title").innerText(),
  turns: await slowPage.locator("#example li").count(),
};
await slowPage.locator("main .landing-cta").first().click();
observations.slowImages.destination = slowPage.url();
await slowPage.evaluate(() => (document.documentElement.dir = "rtl"));
observations.rtlStress = {
  overflow: await slowPage.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  ),
  note: "Structural stress only; English product is not localized",
};
await slow.close();
await browser.close();
await writeFile(
  "docs/animation/evidence/playback.json",
  JSON.stringify(observations, null, 2),
);
console.log(JSON.stringify(observations, null, 2));
