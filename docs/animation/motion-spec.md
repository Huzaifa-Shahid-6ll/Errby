# Errby landing motion specification

19 September 2026. Scope: public `/`; preserve the approved composition and all four fictional conversation turns. `/learn` and `/prepare` remain separate product work. ThemeToggle is a shared control; its behaviour remains unchanged unless verification reveals a defect.

## Direction and boundaries

Three options were considered: **Quiet clarity** (only native state feedback); **Curious performance** (sequential chat, bouncing mascot and section entrances); **A small hello** (recommended: one small mascot greeting plus immediate control feedback). The balanced option gives the robot character without making the visitor wait to read who made the mistake. Sequential chat could suggest a live assessed lesson, conceal the correction and compete with the CTA. It is rejected.

The existing baseline has two 500 ms/8 px whole-hero entrances, two 650 ms mascot entrances, 150 ms CTA movement/shadow and chevron transitions. Refine it to one mascot greeting: copy, transcript, primary action and footer remain stationary. This is a design hypothesis, not a demonstrated conversion improvement.

## Tokens and budgets (declared before refinement)

Scope tokens to `.landing-page`: feedback 140 ms; state change 180 ms; greeting 600 ms. Feedback curve `cubic-bezier(.2,0,0,1)`; arrival `cubic-bezier(.16,1,.3,1)`. Greeting begins -3 deg/3 px and settles at identity; mobile (<640px) -2 deg/2 px, 480 ms. Arrow travels 2 px on fine-pointer hover. Maximum cumulative content reveal delay **0 ms**. No springs, staggers, text masks, progress counters or infinite effects.

| Budget                        | Threshold and measurement                                                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Added animation JavaScript    | 0 bytes: no new client motion component or engine                                                                                                          |
| Additional animation media    | 0 bytes: existing optimized mascot reused                                                                                                                  |
| Final motion stylesheet       | ≤2.5 KiB gzip source; report before/after bytes separately from production bundle                                                                          |
| Animation-caused layout shift | 0; lab total CLS ≤0.01 for matched runs                                                                                                                    |
| Initial-render impact         | Median LCP after ≤before +150 ms or +10%, whichever is larger; three matched localhost lab runs, cold browser cache, precompiled server                    |
| Interaction                   | Native disclosure/anchor state immediate; sampled interaction duration ≤200 ms. This is a lab proxy, not field INP                                         |
| Frame pacing                  | During 1.6s greeting/idle sample, p95 rAF interval ≤33.4ms unthrottled; report actual intervals and 4× CPU slowdown separately, not a universal 60Hz claim |
| Persistent resources          | No animation observers, timers, scroll listeners, continuous loops or `will-change`; ThemeToggle existing observer/listener cleaned on unmount             |

Development server measurements include framework tooling and concurrent workstation load. They cannot certify production Core Web Vitals; deviations must be reported and investigated rather than silently passed. Reference thresholds: [Web Vitals](https://web.dev/articles/vitals), [INP](https://web.dev/articles/inp). Repeat exactly the same browser/viewport/network/CPU scenario before and after.

## Section inventory and motion map

| Section            | Visitor question/action                      | Existing issue                                     | Chosen role/static alternative                                             |
| ------------------ | -------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| Header             | Where are teacher information and questions? | Native anchors already sufficient                  | Static navigation, immediate focus; theme switch changes palette instantly |
| Hero copy/CTA      | What is Errby? See an example                | Whole text/action group moved on initial load      | Stationary text and targets; local arrow feedback only                     |
| Transcript         | Who explains, errs, and corrects?            | Entire conversation moved; no need to pace reading | All turns visible from HTML; one small robot greeting outside text         |
| Learning steps     | What are the four stages?                    | No defect                                          | Static ordered list; no implied completion                                 |
| Supervisor         | What helps with uncertainty?                 | No defect                                          | Static amber guidance; no success or error animation                       |
| Teacher plan       | Which tools are planned?                     | No defect                                          | Static steps/draft/provenance; no simulated uploads                        |
| FAQ                | Is this real?                                | Native state already correct                       | Chevron follows disclosure; answer visibility changes immediately          |
| Closing CTA/footer | What next?                                   | Offscreen mascot entrance runs unseen              | Static mascot and native anchors                                           |

| Effect               | Benefit/research                         | Trigger and states                                                                 | Timing/sequence                                 | Replay/interruption                                                                                                   | Desktop / mobile / reduced                                             | Owner and verification                                                                        |
| -------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| M01 greeting         | Friendly identity, R02/10/16/21          | Initial document render; small robot at -3 deg,+3 px → identity; no opacity change | 600 ms arrival, no delay or dependency          | Once per document appearance; rerenders do not restart; browser handles pause; reduced preference cancels to identity | Mobile -2 deg,+2 px/480 ms; reduced/static identity                    | landing-motion.css; controlled 0 / middle / end frames, playback, live preference change      |
| M02 action feedback  | Recognize actionable link, R09/18/23/37  | Fine-pointer hover: arrow0→2 px; press: immediate background; target never moves   | 140 ms feedback; no delayed navigation          | CSS reverses from current value; repeated clicks remain native                                                        | Touch no hover translation; focus outline independent; reduced instant | landing-motion.css; hover/press/reverse, keyboard and touch CTA journey                       |
| M03 disclosure state | Understand expanded/collapsed, R05/29/35 | Native `open`: chevron180 deg/0 deg; answer shown/hidden immediately               | 180 ms feedback; content not height-animated    | Rapid toggles replace transition; no queues or callbacks                                                              | Same on all widths; reduced chevron state instant                      | landing-motion.css + existing native details; rapid keyboard and pointer toggles              |
| M04 safety/static    | Preserve access, R31/32/39/40/48         | Reduced-motion preference or manual `data-motion="off"` on page root               | All nonessential animations/transitions removed | Changes apply without reload; no recovery work                                                                        | Native scroll, complete visible HTML, forced-color focus/CTA border    | landing-motion.css; no-JS, CSS animation-disabled, preference-change and forced-colors checks |

No scroll engine, pinning, parallax, custom cursor, magnetic target, preloader, animated typography, background gradients, particles, WebGL, autoplay media, fake counters or testimonial carousel. None explains this teaching loop better than the visible transcript. No new package, animation asset or tracking request.

## Maintenance and rollback

Change semantic tokens in `src/components/landing/landing-motion.css`. Keep `#example [data-landing-mascot]` as the only entrance target. Do not add JS initialization or hidden starting states. To disable decoration, set `data-motion="off"` on `.landing-page`; keep theme icon and FAQ state CSS. Removing the stylesheet wholesale also removes theme icon rules, so use the switch instead. Native reading/navigation/disclosure remains complete.

Research, implementation disposition and actual measurement results are in [research.md](research.md), [implementation-status.md](implementation-status.md) and [verification.md](verification.md).
