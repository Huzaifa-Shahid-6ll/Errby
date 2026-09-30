# Errby landing motion specification

30 September 2026. Scope: public `/` only. Learning entry stays `/learn`. Light concept mode, deterministic transcript, no authenticated workflows imported. Supersedes September 19 implementation details.

## Direction

Three options: **Quiet clarity** (state changes only), **Curious performance** (chat sequencing and section entrances), **A small hello** (selected: one small character greeting and restrained controls). The selected direction uses the existing character without hiding the adjacent correction. Reject timed chat, animated headlines, bouncing loops, parallax, particles, scroll pinning, custom cursors, magnetic buttons, counters, video and simulated uploads. They do not explain this concept better.

## Tokens and budgets

Retain existing motion tokens: feedback 140ms; state 180ms; greeting 600ms; feedback cubic-bezier(.2,0,0,1); arrival cubic-bezier(.16,1,.3,1). Greeting -3deg/+3px to identity around 50% 90%; below 640px -2deg/+2px, 480ms. Maximum content reveal/stagger delay **0ms**. These are design choices to inspect, not universal perceptual thresholds.

- Animation JS: **0 added bytes**. Existing CSS file reused; no engine import.
- Motion stylesheet: **<=2.5KiB gzip**; current source gzip 816 bytes before final formatting.
- Optimized first-viewport image payload: **<=150KiB**; additional below-fold notebook derivative **<=100KiB**. Original masters are not the delivery budget.
- No new fonts or dependencies. Shared root already loads Manrope/Figtree and, in live mode, Clerk; marketing uses a system font and does not change those application dependencies.
- Animation-caused CLS **0**; total lab CLS target **<=0.01**.
- Compare identical production page with reduced motion (static control) versus normal motion, same viewport/browser/cache/CPU. Three cold samples plus warm reload; median LCP delta **<=150ms or 10%, whichever is larger**. This isolates motion, not the total redesign. No reproducible original-page production baseline was captured before replacement.
- Native action response target **<=200ms** in lab; not field INP. Idle/greeting p95 rAF interval target **<=33.4ms** unthrottled, report actual display cadence and 4x CPU separately.
- Persistent animation listeners/observers/timers/rAF loops **0**. No will-change or continuously animated media.

Budget deviations stay visible in [verification](verification.md); do not declare field Core Web Vitals from local measurements.

## Section inventory

| Section                 | Visitor question / action            | Motion role                               | Static alternative                         |
| ----------------------- | ------------------------------------ | ----------------------------------------- | ------------------------------------------ |
| Header                  | Find teachers/questions              | None; native disclosure on narrow screens | Same links and menu                        |
| Hero                    | Who teaches whom? See example        | M01 mascot only; M02 CTA arrow/color      | Complete copy, artwork, transcript and CTA |
| Three steps             | What is the intended flow?           | None                                      | Numbered semantic list                     |
| Transcript              | How is a misunderstanding corrected? | M03 alternative-branch chevron            | Both examples in HTML, native disclosure   |
| Supervisor/goals        | What does feedback mean?             | None                                      | Amber role and labelled goal states        |
| Teacher preview         | Who reviews before publication?      | None                                      | Fictional unreviewed draft                 |
| Source material         | What can I start with?               | None                                      | Generated decorative notebook illustration |
| FAQ                     | Clarify limitations                  | M03 chevron only                          | Native disclosure                          |
| Final invitation/footer | See the example                      | M02 CTA only                              | Static character and anchors               |

## Effect map

| ID  | Benefit / research                              | Trigger; start -> end                                                                         | Timing and sequence                       | Replay / interruption                                                                                        | Desktop; mobile; reduced                                                   | Owner / verification                                                              |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| M01 | Warm character; R02/10/15/16/21                 | Document appearance; -3deg/+3px -> identity; opaque throughout                                | 600ms arrival; no dependency/delay        | Once per document; native rerender retains element; refresh replays; preference cancellation leaves identity | Desktop 3px; phone 2px/480ms; reduced/static identity                      | landing-motion.css and hero data hook; controlled frames and live preference test |
| M02 | Recognize action; R09/18/23/37/38               | Fine-pointer hover arrow 0 -> 2px; button background indigo -> darker indigo; press immediate | 140ms feedback; no delayed click          | CSS reversal; no callbacks                                                                                   | Mouse arrow only; touch color feedback; reduced no transition/moving arrow | CSS + landing-cta class; fixed bounding box, touch and contrast checks            |
| M03 | Show expansion state; R05/18/24/29/35           | Native details open; chevron 0 -> 180deg                                                      | 180ms feedback; text visibility immediate | Rapid retoggle retargets; no queue                                                                           | Same semantic operation; reduced static rotated state                      | CSS/HTML; repeated Space/Enter, focus and no-JS tests                             |
| M04 | Escape and section orientation; R24/35/40/46/47 | Menu key/click, immediate close and destination focus                                         | No animation or timer                     | React-owned handlers; no persistent subscriptions                                                            | Only narrow menu; no-JS native toggle/anchors remain                       | landing-menu.tsx; Escape and destination focus tests                              |

## Fallback and maintenance

Set `data-motion="off"` on the existing `.landing-page` root to disable all timelines/transitions. Remove the landing-motion.css import to remove decorative choreography entirely. Native details remain functional and expanded states remain meaningful. Reduced motion is automatic and dynamic; root globals already switch native smooth scrolling to auto. No theme or global app tokens were changed.

Use the existing small timing scale rather than introducing per-card timelines. Never animate the correction, progress, teacher approval or product outcomes. Add no image text or UI screenshots masquerading as real product evidence. Empty alt text marks decorative artwork; speaker names remain actual text.

## Assets

Existing errby-mascot.png and learner-avatar.png are user-authorized generated assets with prior provenance in [the asset register](../design-research/LANDING_PAGE_ASSETS.md). New `public/images/errby-notebook.png`: generated September 30 with built-in imagegen, using existing Errby as identity reference; transparent 1536×1024 PNG, 1,453,751-byte master. Prompt requested a listening robot beside blank notebook/pencil, no text, logos, UI or humans. Original retained at `C:/Users/HUZAIFA/.codex/generated_images/01a0f2c4-5fc1-7841-9160-7123fc2f1d2a/exec-f86c96a3-800d-4346-b2ea-0a4c0dffa0c1.png`. Copied into the project; served through Next Image with explicit aspect ratio and responsive sizes. No competitor asset copied. Next/React installed licenses are MIT; existing font OFL files remain in public/licenses.

## Outcome hypothesis

A brief greeting may make the character feel approachable while the complete transcript explains the task. Test comprehension and teacher navigation with consenting participants later. No analytics added, no conversion uplift claimed.
