import { chromium } from "@playwright/test";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const phase = process.argv[2] || "after";
const url = process.env.MOTION_URL || "http://127.0.0.1:3001";
const output = new URL("./", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
// Compile the development route before measuring; sample contexts still start with empty caches.
const preflight = await browser.newPage();
await preflight.goto(url, { waitUntil: "load" });
await preflight.close();
const result = {
  phase,
  date: new Date().toISOString(),
  browser: browser.version(),
  url,
  conditions:
    "Windows, headless Chromium, 1366x768 DPR1, localhost, no network throttling, precompiled dev server, each cold run fresh context; warm reload same context. CPU4 is CDP emulation, not a real low-end phone.",
  samples: [],
};
for (const cpu of [1, 4]) {
  for (let run = 0; run < (cpu === 1 ? 3 : 1); run++) {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    await cdp.send("Performance.enable");
    await page.addInitScript(() => {
      window.motionMetrics = { lcp: 0, cls: 0, longTasks: [], events: [] };
      for (const [type, key] of [
        ["largest-contentful-paint", "lcp"],
        ["layout-shift", "cls"],
        ["longtask", "longTasks"],
        ["event", "events"],
      ]) {
        if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (key === "lcp") window.motionMetrics.lcp = e.startTime;
            else if (key === "cls" && !e.hadRecentInput)
              window.motionMetrics.cls += e.value;
            else if (key === "longTasks")
              window.motionMetrics.longTasks.push(e.duration);
            else if (key === "events" && e.interactionId)
              window.motionMetrics.events.push({
                name: e.name,
                duration: e.duration,
              });
          }
        }).observe({ type, buffered: true, durationThreshold: 16 });
      }
    });
    for (const cache of run === 0 ? ["cold", "warm"] : ["cold"]) {
      const errors = [];
      const onError = (e) => errors.push(e.message);
      page.on("pageerror", onError);
      if (cache === "warm") await page.reload({ waitUntil: "load" });
      else await page.goto(url, { waitUntil: "load" });
      await page.locator("#hero-title").waitFor();
      await page.evaluate(() => document.fonts.ready);
      const frames = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const values = [];
            let previous, start;
            function tick(now) {
              if (previous) values.push(now - previous);
              previous = now;
              start ??= now;
              if (now - start < 1600) requestAnimationFrame(tick);
              else resolve(values);
            }
            requestAnimationFrame(tick);
          }),
      );
      const beforeInteraction = await page.evaluate(() => ({
        ...window.motionMetrics,
        navigation: performance.getEntriesByType("navigation")[0].toJSON(),
        resources: performance
          .getEntriesByType("resource")
          .map((e) => ({
            name: e.name,
            transfer: e.transferSize,
            encoded: e.encodedBodySize,
          })),
        active: document
          .getAnimations()
          .filter((a) => a.playState === "running").length,
      }));
      const cta = page.locator("main .landing-cta").first();
      await cta.click();
      await page.waitForURL(/#example$/);
      const summary = page.locator("#questions summary").first();
      await summary.click();
      await summary.click();
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const final = await page.evaluate(() => window.motionMetrics);
      const metrics = await cdp.send("Performance.getMetrics");
      const ordered = [...frames].sort((a, b) => a - b);
      result.samples.push({
        cpu,
        run,
        cache,
        ...beforeInteraction,
        events: final.events,
        frameP95: ordered[Math.floor(ordered.length * 0.95)],
        frameMax: Math.max(...frames),
        frameCount: frames.length,
        errors,
        cdp: Object.fromEntries(
          metrics.metrics
            .filter((m) =>
              [
                "LayoutDuration",
                "RecalcStyleDuration",
                "ScriptDuration",
                "TaskDuration",
                "JSHeapUsedSize",
              ].includes(m.name),
            )
            .map((m) => [m.name, m.value]),
        ),
      });
      page.off("pageerror", onError);
    }
    await context.close();
  }
}
const css = await readFile("src/components/landing/landing-motion.css");
result.stylesheet = {
  sourceBytes: css.length,
  gzipBytes: gzipSync(css).length,
};
await writeFile(
  new URL(`${phase}-metrics.json`, output),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify(
    {
      phase,
      browser: result.browser,
      stylesheet: result.stylesheet,
      samples: result.samples.map(
        ({
          cpu,
          run,
          cache,
          lcp,
          cls,
          frameP95,
          frameMax,
          longTasks,
          events,
          active,
          errors,
        }) => ({
          cpu,
          run,
          cache,
          lcp,
          cls,
          frameP95,
          frameMax,
          longTasks,
          events,
          active,
          errors,
        }),
      ),
    },
    null,
    2,
  ),
);
await browser.close();
