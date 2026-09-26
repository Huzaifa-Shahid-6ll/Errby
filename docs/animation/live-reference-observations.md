# Live motion reference observations

Observed **19 September 2026**, approximately 17:57–18:01 UTC, in isolated headless **Chromium 153.0.8010.12** through installed Playwright. Desktop viewport **1280 × 800 CSS px**; two additional responsive checks at **390 × 844 CSS px**. Twelve accessible references span twelve domains. This is a focused temporal inspection, not a usability study or a complete motion/accessibility audit.

## Evidence method and limits

- Page load, idle and hover were sampled over time. JSON records retain `performance.now()` timestamps, animation `currentTime`, timing declarations and sampled computed styles. The first pass sampled twice; subsequent targeted passes sampled 5–7 times at nominal 500–600 ms intervals. Hover passes sampled at nominal 100 ms intervals. Actual timestamp gaps sometimes grew under browser load; they are retained, not rounded into a claimed frame rate.
- **Observed** means state or animation progress changed between live samples. **Declared** means the browser's CSS/Web Animations timing, not an independently measured perceived duration. No exact duration below is an eyeballed estimate. A stopped/finished animation in every sample does not establish how its entrance looked.
- `document.getAnimations()` includes offscreen nodes. Where visibility was not established, the record says page-wide or offscreen. Empty lists do not establish an absence of JS, canvas, video or other animation.
- Screenshots corroborate appearance and interaction endpoints; they do not independently prove motion. All screenshot links below were visually inspected. Raw JSON is the temporal evidence. Source screenshots remain research material, not licensed Errby assets.
- Contexts were public, unauthenticated and disposable. No form submissions, purchases, account creation or access-challenge bypasses. Cookie overlays remained where they blocked interaction. No provider/model calls or package installations.
- Responsive checks below changed viewport only; they did not emulate a physical touch device. Mobile hover results are pointer-in-narrow-viewport observations, not touch behavior. Reduced-motion preferences were **not** audited on these references.

## Twelve live references

### M01 — Khanmigo: rotating role text

[Live page](https://www.khanmigo.ai/) · education · desktop only.

**Section/trigger:** hero suffix, automatically after load. The targeted sequence changed from “teaching assistant.” at 865 ms to “tuto” at 1378 ms, then “tutor.” in later samples and “tu” at 3961 ms. These are document-relative sample times, not the complete loop period. This establishes character-level replacement across time; the precise typing cadence was not measured. The introductory H1 stayed fixed while the sibling suffix changed. The cookie notice separately exposed a declared 2000 ms entrance; it is not part of the hero animation.

**Errby lesson:** keep the educational proposition and speaker labels stable. Character-by-character replacement is a poor default for Errby's explanation transcript because readers need the full correction available at their own pace. A deliberate, user-triggered example step could change only a bounded region.

**Limits/evidence:** navigation hover was intercepted by the consent overlay; no working navigation interaction is claimed. [Temporal text samples](reference-evidence/khanmigo-text.json), [initial capture](reference-evidence/khanmigo-before.png), [failed hover record](reference-evidence/khanmigo.json).

### M02 — Notion Sites: small hover feedback, large explicit result

[Live page](https://www.notion.com/product/sites) · product explanation · desktop and 390 × 844.

**Section/trigger:** desktop Product navigation, pointer hover. Its transparent background became `rgba(0,0,0,.05)` and the product menu opened. The control declares a **150 ms background-color transition**. The first post-hover sample already had the target background, so this is a declared timing with observed endpoint, not a measured 150 ms interpolation. Page-wide animation count rose and then settled; that count alone does not identify every submenu property.

**Responsive observation:** at 390 px the hero remained readable, the navigation became a compact logo/CTA/menu row, and the process row exposed step 1 with part of step 2. The heading did not change through the 2.84 s sample window. The narrow-viewport CTA darkened on pointer hover without a sampled transform. No mobile menu or process-step click was performed in this pass.

**Errby lesson:** allow small color feedback on controls while preserving reading position. If example steps are offered, make their order and selected state explicit; avoid partially clipped teaching content.

**Evidence:** [desktop data](reference-evidence/notion.json), [open menu](reference-evidence/notion-hover.png), [responsive data](reference-evidence/notion-mobile.json), [responsive view](reference-evidence/notion-mobile-before.png).

### M03 — COLLINS: slow entrance, then stillness

[Live page](https://www.wearecollins.com/) · editorial agency · desktop only.

**Section/trigger:** page-load H1, laurels and reel section. The H1 had a running animation at 1600 ms of its timeline with declared **2000 ms duration + 100 ms delay**, easing `cubic-bezier(.19,1,.22,1)`. The reel declaration used a 200 ms delay. Approximately 1.51 s later those running entrances were absent, leaving a paused preview animation. The first screenshot is already close to the settled composition; it must not be used to reconstruct an unobserved starting transform.

**Errby lesson:** an entrance can end and leave a stable page. Errby's practical educational copy should settle much faster than this agency's two-second staging. Do not animate every paragraph or reproduce the empty first-screen composition.

**Evidence/limits:** [timelines](reference-evidence/collins.json), [viewport](reference-evidence/collins-before.png). No hover target meeting the capture filter was found; no mobile, scroll transition or menu operation inspected.

### M04 — Instrument: multiple independent motion systems

[Live page](https://www.instrument.com/) · agency · desktop only.

**Section/trigger:** load/idle, followed by consent-button hover without clicking. Page-wide samples caught a declared **300 ms** logo transition, later **300 ms ease-in-out** client-rotator transitions and a **500 ms** cookie-notice entrance using an overshooting cubic-bezier. These nodes were not all established as visible in the viewport. The first screenshot had a masthead and an unloaded/blank hero region; the later hover screenshot contained the loaded reel artwork and cookie UI. Loading differences are not evidence of an authored reveal sequence.

**Errby lesson:** scope motion to one subject at a time. Avoid simultaneous logo rotation, ambient media and text movement beside a reading task. A finite mascot greeting is preferable to copying the site's multiple independent systems.

**Evidence/limits:** [temporal data](reference-evidence/instrument.json), [initial view](reference-evidence/instrument-before.png), [later view](reference-evidence/instrument-hover.png). The hovered cookie button's own sampled color/background/transform remained unchanged. No cookies accepted, reel playback or scroll flow verified.

### M05 — Pentagram: image opacity transitions

[Live page](https://www.pentagram.com/) · editorial portfolio · desktop only.

**Section/trigger:** image loading/page initialization. A cluster of image elements had running opacity transitions at timeline time ~200 ms, with declared **300 ms** duration and `cubic-bezier(.4,0,.2,1)`. A selected carousel text slide declared **400 ms ease-in-out**. At the next sample ~2.60 s later the animation list was empty. Four discovered autoplay video elements stayed paused at time 0 across both samples; autoplay attributes did not establish actual playback.

**Errby lesson:** if visual assets need a reveal, make it a short opacity treatment after their dimensions are reserved. Keep the correction text available immediately; never infer a working video or live demonstration from attributes alone.

**Evidence/limits:** [timelines/video state](reference-evidence/pentagram.json), [initial viewport](reference-evidence/pentagram-before.png). Image animations were page-wide, not all in view. The viewport itself was largely empty above the visible lower section. No claim of an impressive rendered hero or tested carousel interaction.

### M06 — Linear: continuous page-wide SVG loops

[Live page](https://linear.app/) · technical product · desktop only.

**Section/trigger:** load/idle. SVG circle animations advanced from timeline time 0 to ~3183 ms between captures and declared **2800 ms linear infinite** cycles. These are page-wide nodes; their rendered location was not confirmed. The initial viewport capture was mostly blank below navigation. An attempted hover selected an invisible skip link and timed out; it is not a navigation usability finding.

**Errby lesson:** a continuous animation may still run outside the reading area. Errby should stop decorative work when offscreen and avoid loops that imply the fictional conversation is processing real learner input.

**Evidence/limits:** [temporal record](reference-evidence/linear.json). Limited visual rendering makes this an implementation-behavior reference and caution, not a source for exact art direction. No mobile or reduced-motion result.

### M07 — Stripe: navigation reveal with explicit hierarchy

[Live page](https://stripe.com/) · product infrastructure · desktop only.

**Section/trigger:** Products navigation hover. A large, grouped navigation panel became visible. The trigger declares **240 ms** color/background/border transitions with `cubic-bezier(.45,.05,.55,.95)`, but its sampled text color and background did not change. The menu's appearance is observed; its duration is **not** inferred from the trigger declaration. Page-wide active animation count rose to 52 then fell, without establishing that every animation belonged to the menu. Separately, initialization span animations declared 325 ms with 400/450 ms staggered delays.

**Errby lesson:** transitions should expose a clear state or destination. Errby has few public destinations and does not need a mega-menu; use a compact menu or direct links. Do not copy financial counters or complex demonstrations.

**Evidence:** [samples](reference-evidence/stripe.json), [open menu](reference-evidence/stripe-hover.png). No mobile, full animation sequence, keyboard or dismissal audit.

### M08 — Vercel: immediate hover state, separate canvas entrance

[Live page](https://vercel.com/) · product infrastructure · desktop only.

**Section/trigger:** Products navigation hover. Text darkened from RGB 77 to RGB 23 and a full-width menu opened, with the background page subdued. No non-zero transition duration was exposed on the sampled trigger; do not call its reveal a measured animation. During idle sampling a canvas element had a running **1200 ms linear opacity transition**, sampled at ~1067 ms. Internal canvas animation was not inspected.

**Errby lesson:** clear hover/focus feedback does not require a spring or sliding text. Separate optional decorative media from essential reading content, and use the smallest interaction necessary for the number of links.

**Evidence:** [timing/state record](reference-evidence/vercel.json), [open menu](reference-evidence/vercel-hover.png). Desktop only; no claim of the exact menu easing or canvas behavior.

### M09 — Headspace: headline replacement can interrupt reading

[Live page](https://www.headspace.com/) · character-led adjacent reference · desktop and 390 × 844.

**Section/trigger:** automatic hero-title variant. Targeted live inspection identified the actual `hero-headline-variant-module-title` element, with opacity 0→1 keyframes, declared **300 ms linear duration**, and an in-progress inline `translateY(29.3333px)` on “Stress less”. The site also exposed a **750 ms ease-out** opacity change on an image much farther down the page; its rectangle was around y=3078 and it was not in view. Do not conflate those two effects.

**Responsive observation:** the same hero-title class had progressing/restarting 300 ms timelines at 390 px. The screenshot caught “Feel less anxious” partly behind the compact header, and a large consent notice covered much of the lower screen. This is an observed capture state, not proof of a permanent overlap bug.

**Errby lesson:** reserve stable geometry for changing content and never animate a line behind navigation. Keep the main educational statement static. A child-facing character does not justify continuously replacing copy.

**Evidence:** [target/keyframe samples](reference-evidence/headspace-text.json), [desktop](reference-evidence/headspace-before.png), [responsive timelines](reference-evidence/headspace-mobile.json), [responsive viewport](reference-evidence/headspace-mobile-before.png). No health claims adopted, no consent submission and no mobile menu test.

### M10 — Mobbin public homepage: restrained button interpolation

[Live page](https://mobbin.com/) · design-library marketing · desktop only.

**Section/trigger:** Join for free CTA hover. The button declared **200 ms** color/background transitions. Actual successive background samples progressed from initial RGB 20 to RGB 36 and then RGB 38, staying there; text remained white and transform stayed `none`. This is the clearest captured interpolation in the set. Snapshot sampling interval limits exact start/end timing.

**Idle observation:** recorded Framer animation timelines were already at their end values (800/1600 ms) throughout the idle samples. That does not demonstrate a live entrance. The public hero illustration changed between screenshot endpoints, but its full cadence/trigger was not measured.

**Errby lesson:** a tiny surface shift communicates an actionable CTA without moving its label. Reuse that degree of restraint with Errby's indigo tokens. The protected flow library was not accessed.

**Evidence:** [hover samples](reference-evidence/mobbin.json), [hover endpoint](reference-evidence/mobbin-hover.png).

### M11 — GitHub: user-directed menu versus background marquee

[Live page](https://github.com/) · developer product · desktop only.

**Section/trigger:** Platform navigation hover. The label changed from white to muted green-gray and a grouped dark menu opened. Sampled transforms remained `none`; exact reveal timing was not measured. Separately, page-wide logo-marquee animation times advanced across five samples and declared **60000 ms linear infinite** cycles. Hero-carousel description transitions were caught with **200 ms ease-out** declarations, but their complete content sequence was not inspected.

**Errby lesson:** purposeful, user-directed disclosure is more suitable than an endless credibility marquee. Errby has no verified logo collection to animate. Preserve focus/reading position when showing an explanatory panel.

**Evidence/limits:** [timelines and hover states](reference-evidence/github.json), [open menu](reference-evidence/github-hover.png). No form submission, no mobile or accessibility compliance claim; page-wide loop evidence does not establish in-view motion.

### M12 — Figma: staged product-media entrance

[Live page](https://www.figma.com/) · creative product · desktop only.

**Section/trigger:** hero-media/CTA load. Targeted samples located the actual media container at approximately x344/y158 and CTA at x984/y467. Both exposed opacity keyframes with declared **1250 ms duration**, media delay **200 ms**, CTA delay **400 ms**; the rapid opacity portion occupied the first 2% of the keyframes. Inline near-settled translation/scale values were present, but the whole transform curve was not measured. A separate aria-hidden element near y5909 advanced a **25000 ms linear 0→360° rotation** offscreen. Its timing must not be described as the hero animation.

**Errby lesson:** stage a visual and its associated action with a small offset only when it improves attention order. Keep Errby's text readable from the start. Do not recreate a multi-asset showreel or long delay before the learner can use the example.

**Evidence/limits:** [initial timeline pass](reference-evidence/figma.json), [targeted keyframes/rectangles](reference-evidence/figma-targets.json), [successful second capture](reference-evidence/figma-targets.png). First screenshot timed out; second pass succeeded. A visible media Pause control was detected but not operated, so media-control usability remains unverified.

## Blocked or excluded attempts

- Brilliant and Duolingo: initial `domcontentloaded` navigation exceeded the 18 s budget. No temporal conclusion from those attempts. The earlier static design research remains separate.
- Canva Education and Quizlet: access/security challenge pages; no challenge interaction or bypass. Challenge-page samples are retained only to document the access failure, not counted as design references.
- Twelve successful domains above exclude these four attempts. Supporting raw records are under `reference-evidence/`; `observations.json` contains only the first batch, while the per-site files include subsequent refinements.

## Recommendations supported by this pass

1. **Controls:** brief 150–200 ms color/surface changes are enough; Mobbin provides directly sampled interpolation, Notion a declared 150 ms treatment with observed menu result.
2. **Reading:** keep the whole Errby/student/correction transcript and proposition static. Khanmigo and Headspace demonstrate the temporal cost of changing words; neither proves such movement improves learning.
3. **Character:** one finite entrance/greeting, then rest. COLLINS shows a transition can finish; the technical sites demonstrate how unrelated loops accumulate. Do not animate the deliberate error as an alert or reward.
4. **Optional demonstration:** user-triggered step changes may highlight the active turn without removing readable evidence. This is an Errby recommendation, not a tested conversion finding from these sites.
5. **Reduced motion:** use stable endpoints and instantaneous essential state changes in Errby. This requirement comes from Errby's accessibility goals; this pass did not establish reference-site compliance.

Research tooling documentation was resolved and queried through Context7 using the official `/microsoft/playwright` repository: [isolated contexts](https://github.com/microsoft/playwright/blob/main/docs/src/api/class-browsercontext.md) and [viewport emulation](https://github.com/microsoft/playwright/blob/main/docs/src/emulation.md). No application implementation was changed by this research subtask.
