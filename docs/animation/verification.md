# Landing verification — 30 September 2026

## Delivered result and routes

Rebuilt the existing marketing route as the supplied eight-section light concept page. The user-requested existing Errby and learner images replace the temporary CSS character marks. Added one original notebook illustration using built-in imagegen. Reused the existing finite greeting/control CSS; did not import the application chat bundle or add dependencies.

| Destination                                    | Result                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/`                                            | Public concept landing; prerendered in demo production build                       |
| `/#example`                                    | Complete prewritten heat-transfer example; native disclosure for Supervisor branch |
| `/#how-it-works`                               | Intended three-step learning flow                                                  |
| `/#for-teachers`                               | Review-before-publish workflow and fictional draft                                 |
| `/#questions`                                  | Seven native FAQ disclosures                                                       |
| `/learn`                                       | Existing learning composer/workspace preserved; eight regression checks pass       |
| Existing account, class and preparation routes | Preserved; no authentication implementation changed by this task                   |

Concept mode is deliberate: historical hosted evidence predates the in-progress Clerk changes present at task start. This marketing task did not reverify the new live learning loop. No sign-in, join, teacher-launch, pricing or policy CTA is presented as verified public access. No invented origin/canonical/social URL; existing prototype noindex remains. Title and description updated.

## Checks and actual outcomes

- Final optimized demo production build: `$env:ERRBY_MODE='demo'; npm run build -- --webpack` passed compilation, TypeScript, static generation and route tracing. The initial default Turbopack run remained in compile without completion and was stopped. Webpack reports an existing `module.createRequire failed parsing argument` warning in ingestion/server.ts; no landing warning or ingestion packaging success is inferred.
- Initial Webpack typecheck found saved backup TSX/test files inside TypeScript's broad include. Renamed our backup copies to .bak, preserving the original working-tree files; rerun passed.
- Task-scoped ESLint with zero warnings passed for page/menu/tests. Changed-file Prettier and diff whitespace checks pass. Full-repository SQL/provider tests were not rerun for a marketing-only change.
- Final browser suite: **20/20** passed in **23.1s**, Chromium desktop/phone: landing.spec.ts, landing-motion.spec.ts and unchanged home.spec.ts. Two later added delayed-image checks passed in **2.4s**. **22 distinct browser checks passed**, across those two runs.
- First full run: 16/20. Fixed decorative halo overflow at 1024px by reducing its extent. The no-JS pointer action encountered Playwright's stability wait after smooth anchor scrolling; changed that disclosure test to actual keyboard focus/Enter, which passes without scripts. Pointer menu/CTA and separate touch disclosure checks remain. A prematurely overlapping focused retry disturbed the first run's final trace files; final verification was sequential.
- Native disclosures, branch labels/correction adjacency, no text input, all anchor destinations, absence of page errors and absence of mutation requests pass in demo production. Menu Escape/destination focus, no-JS controls, live reduced-motion cancellation, fixed CTA bounds at animation start/middle/end, rapid repeated toggles, deep link/back/reload and rollback pass.
- 320, 390, 768, 1024 and 1440px; 200% root text, saved dark preference with deliberately light marketing, forced colors, reduced motion, 844×390 landscape, emulated touch, long unbroken copy, failed and deliberately delayed images checked.
- Semantic snapshot shows one H1, ordered headings, visible speaker names, native disclosure labels and decorative empty-alt imagery. This is an assistive-technology structure spot check, not screen-reader speech verification.

## Production performance

[Static/reduced baseline](evidence/2026-09-30/baseline-metrics.json), [normal motion](evidence/2026-09-30/after-metrics.json), [runnable measurement](evidence/measure.mjs).

Windows, headless Chromium **153.0.8010.12**, 1366×768 DPR1, localhost production Webpack build, server/image cache warmed, fresh browser contexts for cold runs; no network throttle. Three cold runs at normal CPU; one warm reload and cold/warm 4× CPU samples per mode. A static control uses reduced motion on the **same redesigned page**, not the original marketing page. Small differences are noise, not a claimed improvement.

| Metric                         | Static control      | Motion enabled        | Result                                                   |
| ------------------------------ | ------------------- | --------------------- | -------------------------------------------------------- |
| Cold LCP median, three samples | 132ms (136/132/132) | 124ms (124/128/124)   | Within +150ms / 10% budget                               |
| Warm LCP                       | 44ms                | 48ms                  | Within budget                                            |
| 4× CPU cold LCP                | 476ms               | 540ms                 | +64ms; emulation only                                    |
| 4× CPU warm LCP                | 172ms               | 152ms                 | No performance-gain claim                                |
| CLS, all samples               | 0                   | 0                     | Within <=0.01 budget                                     |
| p95 rAF interval               | 16.7–16.8ms         | 16.7–16.8ms           | Within <=33.4ms budget                                   |
| Maximum sampled event duration | 32ms                | 40ms including 4× CPU | Below 200ms proxy budget; not field INP                  |
| Normal CPU long tasks          | None                | None                  | No added motion initialization                           |
| 4× CPU cold long tasks         | 196ms               | 55ms and 230ms        | Shared load cost remains; not a low-end device guarantee |
| Initial encoded JS             | 142,705 bytes       | 142,705 bytes         | 0-byte motion JS delta                                   |
| First-view encoded images      | 15,322 bytes        | 15,322 bytes          | Below 150KiB budget                                      |

Motion CSS is 2,473 source bytes / **816 gzip bytes**. Landing-specific production page chunk is 3,667 bytes / 1,541 gzip bytes (menu/image glue; excludes shared framework chunks). No new package/font/engine. New notebook derivative observed in T3 at 384px: **16,102 encoded bytes**, below the 100KiB additional-art budget. Masters are larger and remain in public/images; Next Image delivers resized derivatives.

The initial warm measurement accidentally reloaded at the previous #example hash. That made two LCP samples invalid (0). The script now removes the hash and resets to the top before warm reload; the linked final data is the corrected complete rerun.

CDP layout/style totals are included in raw data. No detailed GPU paint trace, physical power measurement, field p75 metrics, or original-page production before/after baseline is claimed. No numerical learning/conversion outcome is inferred.

## Visual and temporal evidence

- [Desktop full page](evidence/2026-09-30/desktop.png)
- [Phone full page](evidence/2026-09-30/mobile.png)
- [Greeting start](evidence/2026-09-30/greeting-start.png), [middle](evidence/2026-09-30/greeting-middle.png), [end](evidence/2026-09-30/greeting-end.png)
- [Recorded greeting and controlled pause](evidence/2026-09-30/greeting.mp4)
- [Contrast calculations](evidence/2026-09-30/contrast.json)

Controlled greeting times 0/300/600ms were sampled through T3; the middle time remained 300ms before and after the saved screenshot, confirming it was not silently fast-forwarded. Start transform was -3deg/~3px; end identity. Automated checks cover cancellation/reversal and stable targets. Final source-material illustration and desktop/phone composition were visually inspected. No clipping after halo repair.

Text contrast ranges from 5.47:1 for the goal label to 14.99:1 for body text. Primary normal/hover/pressed are 6.29/7.90/9.93:1; control boundary 3.74:1. Text stays on opaque, stationary surfaces. This is not complete WCAG certification.

## Reproduce

Use npm and the existing lockfile. No Docker, database setup or paid model call is needed for this page.

```powershell
$env:ERRBY_MODE='demo'
npm run build -- --webpack
npm run start -- --port 3200
```

Open http://127.0.0.1:3200/. The existing live development server on 3100 was left running.

For production browser tests, this task used an ignored `test-results/landing.config.ts` with the existing config's desktop/phone projects, one worker, baseURL 3200, outputDir landing-results, and a demo `npm run start -- --port 3200` webServer using /api/health readiness and reuseExistingServer true. Its exact reusable configuration:

```ts
import { defineConfig } from "@playwright/test";
import config from "../playwright.config";
export default defineConfig({
  ...config,
  testDir: "../tests/browser",
  outputDir: "./landing-results",
  workers: 1,
  timeout: 90000,
  use: { ...config.use, baseURL: "http://127.0.0.1:3200" },
  webServer: {
    command: "npm run start -- --port 3200",
    url: "http://127.0.0.1:3200/api/health",
    env: { ERRBY_MODE: "demo" },
    timeout: 120000,
    reuseExistingServer: true,
  },
});
```

```powershell
npx playwright test --config=test-results/landing.config.ts landing.spec.ts landing-motion.spec.ts home.spec.ts
node docs/animation/evidence/measure.mjs baseline
node docs/animation/evidence/measure.mjs after
```

Run measurements sequentially with other browser work idle. Alternatively, when port 3100 is free, the unchanged default Playwright config can run these same tests against its managed demo development server.

## Changed files and remaining limits

Implementation: src/app/page.tsx; src/components/landing/landing-page.tsx, landing-page.module.css, landing-motion.css, new landing-menu.tsx; new public/images/errby-notebook.png. Tests: tests/browser/landing.spec.ts and landing-motion.spec.ts. Documentation: this report, research.md, motion-spec.md, implementation-status.md, measurement script, dated reference/visual/metric evidence, and setup-status addendum. Existing auth/global-layout/dependency changes were already present and remain outside this task.

Coverage: 60 research rows; 60 implementation dispositions; 12 live references across 12 domains. Check counts are not independent experiments. Firefox/WebKit are not installed and were not executed. No physical phone, screen-reader speech, background-tab power behavior, BFCache certification, human subject review or field performance evidence. The teaching wording remains explicitly unreviewed. The shared live Clerk provider still exists at root and was not part of the demo production performance measurement.

No commit, push, deployment, database mutation, real pupil data or paid learning-model request. Built-in image generation was explicitly authorized. Rollback is `data-motion="off"` or removal of the landing-motion.css import; native content and controls remain.
