# Errby public landing-page specification

17 September 2026 · Recommended direction: **Teach the curious bot** · Design specification only

**19 September implementation addendum:** the user subsequently authorised building this page, requested matching light/dark modes and a full animation pass. The original design-only and light-only constraints below are historical. See [implementation and browser evidence](LANDING_PAGE_IMPLEMENTATION.md) and the [motion specification](../animation/motion-spec.md) for the implemented additions. The written copy and truthful role/provenance requirements continue to apply.

This is the authoritative source for copy, roles, layout and behaviour. [Research](LANDING_PAGE_RESEARCH.md) explains the evidence; [reference index](REFERENCE_INDEX.md) supplies direct sources; [image prompts](LANDING_PAGE_IMAGE_PROMPTS.md) records generation and corrections. Generated images illustrate the direction, not exact CSS.

## Goal and scope

Help a first-time visitor understand that the student teaches Errby, sees a deliberate error and explains the correction. Give teachers an immediate route to the planned classroom workflow.

**Current primary conversion:** inspect the fictional example. “See an example” links to `#example`, bringing the transcript heading into view. The example is already visible alongside the hero on desktop; the action also works from the header/footer and reveals its location on a phone. No modal, request, signup, live model call or simulated assessment is needed.

**Secondary conversion:** “Explore the teacher plan” links to `#teachers`. Keep its visual weight below the indigo primary button. These are proposed local anchors, not new application routes implemented by this task.

When a genuine start-lesson path exists, “Teach Errby” can replace the primary action after the real destination and disclosure copy are verified. Do not advertise signup, upload or teacher access as working before then. Keep the public page separate from the signed-in learning home: no sidebar, lesson composer, history, class code form or progress panel. Do not change the existing route during this design task.

## Exact section order and copy

### 1. Header

Purpose: establish identity and let teachers navigate without dominating the learner story.

- Wordmark: existing lowercase **errby.**, linked to the page top.
- Desktop links: **How it works** → `#how-it-works`; **For teachers** → `#teachers`; **Questions** → `#questions`.
- Desktop trailing primary action: **See an example** → `#example`.
- Phone header: wordmark, **Teachers**, **Questions**; same destinations. The main CTA follows in the hero. No hamburger is necessary for two links. Wrap the links to a second row on very narrow/zoomed layouts instead of clipping them.

Static header, not sticky by default. A skip link goes to `#main`. No account controls without a working account destination.

### 2. Hero and example

Question answered: What is Errby, and what will I actually do?

Eyebrow: **A learning app in development**

H1: **Teach Errby. Catch its mistakes. Explain your thinking.**

Supporting paragraph: **You do the explaining. Errby asks questions and sometimes gets things wrong on purpose.**

Primary: **See an example** with a decorative right arrow. Secondary: **Explore the teacher plan**.

Supporting note: **Illustrative preview · not a live lesson.**

Desktop composition: copy on the left, conversation on the right. Colour only “Catch its mistakes.” indigo; other words use primary navy text. Aim for three phrases across three lines at wide sizes, but permit extra wrapping where the actual type needs it. Never shrink the transcript to preserve a target hero height. No forced viewport-height section.

Conversation heading (`#example`): **Why does ice melt?**

Provenance label: **Fictional example · unreviewed**

| Order | Visible speaker label      | Exact message                                      | Treatment                                             |
| ----- | -------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| 1     | Errby                      | Why does ice melt in a warm room?                  | Pale indigo bubble; Errby name/avatar                 |
| 2     | You                        | Heat moves from the warmer room into the ice.      | Neutral bubble; neutral learner avatar                |
| 3     | Errby · deliberate mistake | So the ice makes its own heat?                     | Pale indigo; deliberate-mistake label remains visible |
| 4     | You                        | No. The energy comes from the warmer surroundings. | Neutral bubble; learner explains correction           |

Card footer: **Example only · no assessment**

Use an ordered transcript in document order. Labels are real text, not colour alone. Both learner messages stay left-aligned for reading; mild indentation can distinguish the roles without a large zigzag. No input, typing cursor, send button, score, checkmark, completed objective or “correct!” banner. This excerpt illustrates a conversational pattern; it is not a complete reviewed science lesson or sufficient evidence of lesson completion.

The small supplied robot may sit beside the card heading, at most 64px desktop/48px phone, without overlapping any label. Use smaller repeated avatars only if space allows; at narrow widths remove avatars before reducing text. Do not use a giant decorative bot in place of the transcript.

### 3. Learning sequence (`#how-it-works`)

Question answered: How does this learning approach work?

H2: **A different way to practise.**

| Step | Title            | Description                                       |
| ---- | ---------------- | ------------------------------------------------- |
| 01   | Errby asks       | Errby poses a question about your topic.          |
| 02   | You explain      | You share your thinking in your own words.        |
| 03   | Spot the mistake | Errby sometimes gets things wrong on purpose.     |
| 04   | Correct it       | You explain what’s not quite right and try again. |

Use a semantic ordered list, not four button-shaped cards. Desktop: four equal columns connected by optional decorative hairlines. Tablet: two columns. Phone: one vertical list. Numbers provide sequence, not progress status. These labels summarize the visible example; no hidden step or autoplay state.

### 4. Supervisor explanation

Question answered: What helps when there is a misconception or uncertainty?

H2: **A second voice when you need it.**

Body: **The planned Supervisor is separate from Errby. It helps address misconceptions and flags uncertainty.**

Amber guidance panel:

- Shield icon and label: **Supervisor**
- Provenance: **Fictional guidance example**
- Guidance: **Let’s check where the heat comes from.**
- Supporting sentence: **If a claim cannot be verified, it stays unresolved.**

This is a separate explanatory vignette, not a fifth hero message or a judgment of the learner's correct correction. The planned live Supervisor supports submitted answers that need correction/clarification and flags unverifiable claims; it is not the same persona as Errby. No suggestion that Supervisor-provided wording becomes learner evidence. Do not claim high-stakes marking, guaranteed correctness or automatic completion. Two columns on desktop; explanation then amber panel on phones. Keep the shield distinct from Errby's robot.

### 5. Teacher workflow (`#teachers`)

Question answered: What is planned for my materials and class, and what do I review?

Eyebrow: **FOR TEACHERS · PLANNED WORKFLOW**

H2: **Your materials. Lessons you review.**

Body: **Create a class, add material, review lesson drafts, then publish selected lessons.**

| Step | Label           | Supporting copy                                 |
| ---- | --------------- | ----------------------------------------------- |
| 01   | Create class    | Set up your class and details.                  |
| 02   | Add material    | Add a topic list or text/PDF material.          |
| 03   | Review          | Check and edit lesson drafts.                   |
| 04   | Publish         | Publish selected lessons.                       |
| 05   | Review evidence | Review what students can explain in your class. |

One static illustrative lesson card: **Heat transfer** / **Draft · needs teacher review**. A small topic icon is optional. This is explanatory content, not a selectable draft or an upload drop zone.

Availability notice, always visible: **These teacher tools are planned and are not available in the current demo.**

Desktop: short introduction and example draft share a row; five concise steps below. If descriptions cannot fit at 16px, use a vertical list rather than shrinking type. Tablet/phone: all content stacks in reading order. No fake learner list, evidence chart, user count, school badge, DOCX/link importer or fabricated published lesson. The phrase “in your class” preserves class-scoped access; private independent learning is not advertised as visible to teachers.

### 6. Questions (`#questions`)

Question answered: Is this real today, and what do these roles mean?

H2: **A few things to know.**

| Question                       | Exact answer                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Is this a live lesson?         | No. This is a fictional, unreviewed example.                                  |
| Why does Errby make mistakes?  | So you can practise spotting and explaining them.                             |
| Does the Supervisor mark work? | It is designed to guide and flag uncertainty, not provide high-stakes grades. |

Native `details`/`summary` is sufficient. Render all three open by default to match the concept and keep material limits visible; visitors may collapse them independently. Entire summary row is the control. Chevron rotates according to actual open state; do not copy a generated down-chevron on an already open answer. No custom accordion dependency, exclusive state machine or height animation.

### 7. Closing invitation and footer

H2: **What would you teach Errby?**

Action: **See an example** → `#example`.

Use a pale-indigo field and a modest robot, separated from text. This repeats the same action, not a new conversion request.

Footer: wordmark and **How it works**, **For teachers**, **Questions** anchors. For this concept review, show **Design concept · September 2026**. Before production, replace only when real organisational/legal information exists; do not add nonworking Privacy/Terms links or invent a copyright entity. No newsletter, social proof or social links without a real reason and destination.

## Visual system

The [approved palette](../visual-design/palette-tokens.json) wins over older briefs and approximate generated pixels. Use the existing system sans stack; no new font service or display-font dependency.

| Role                             | Value / rule                                                          |
| -------------------------------- | --------------------------------------------------------------------- |
| Canvas                           | `#F7F9FC`                                                             |
| Primary surface                  | `#FFFFFF`, opaque under text                                          |
| Primary text                     | `#17223B`                                                             |
| Secondary text                   | `#526179`                                                             |
| Primary action / headline accent | `#4F46E5`; action text white                                          |
| Errby bubble                     | `#EEF2FF`; role text `#4338CA`; message text primary navy             |
| Supervisor                       | `#FFF7E6` surface; `#92400E` text; `#B45309` functional edge/icon     |
| Evidence-backed success only     | `#ECFDF5` / `#0F766E`; unused in this unreviewed example              |
| Actual error only                | `#FFF1F0` / `#B42318`; do not mark the learner's correct response red |
| Control boundary                 | `#77859B` where a boundary is needed to identify a control            |

Approximate visual-area target, not a measured constraint: 85–90% white/neutral, 8–12% pale indigo/accent, a small localized amber region. A low-opacity indigo halo may sit behind the hero card only. No saturation across every section, large dark panel, glass under text or automatic theme control. Both supplied token sets remain product assets; this public direction uses light mode.

### Typography and reading width

| Element                 | Desktop ≥1024px                                               | Phone <640px                                   | Weight / width                                         |
| ----------------------- | ------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| H1                      | Preferred 56–64px / 1.05; reduce within range as columns need | 36px / 1.10; 34px at narrow 320px if necessary | 700; about 13–17ch                                     |
| H2                      | 36px / 1.15                                                   | 30px / 1.15                                    | 650–700; about 26ch                                    |
| Card heading / H3       | 22–24px / 1.25                                                | 20–22px / 1.25                                 | 650–700                                                |
| Hero/body               | 18px / 1.55                                                   | 17px / 1.55                                    | 400; body max 60ch, hero around 40ch                   |
| Transcript              | 17px / 1.5                                                    | 17px / 1.5                                     | 400, role labels 600                                   |
| Process descriptions    | 16px / 1.5                                                    | 16–17px / 1.5                                  | 400                                                    |
| Nav, notice, provenance | 14px / 1.45 minimum                                           | 14px / 1.45 minimum                            | 400–600; never hide a qualification in faint microtype |
| Buttons                 | 16px / 1.25                                                   | 16px / 1.25                                    | 600                                                    |

Use rem-equivalent sizing and allow browser text scaling. Do not render these words as an image. Mild heading tracking up to -0.025em is acceptable; body tracking stays normal. Images show proposed line breaks; HTML should wrap naturally. On a 390px phone the H1 will typically occupy five lines. The title, buttons and whole transcript do not all need to fit into the first phone screen.

### Grid, spacing and surfaces

- Main container maximum **1200px**. Outer gutters **40px at desktop**, **24px at tablet**, **20px on phones**, **16px at 320px**. At 1440px, centering the maximum container produces 120px margins.
- Desktop grid: 12 conceptual columns, 24px gaps. Hero starts at 5/7 columns; adjust to roughly 44/56 only if actual headline and transcript remain readable. Do not use fixed screenshot coordinates.
- Main header: 64px minimum desktop, 56px minimum phone; allow height growth with text.
- Hero top/bottom padding: 56–72px desktop, 32–40px phone. Major section separation: 80–96px desktop, 56–64px phone. Sequence may sit 48px below hero to read as its continuation.
- Inside groups: eyebrow→heading 12px, heading→paragraph 16–20px, paragraph→actions 24px, actions→notice 12px. Card padding 24px desktop and 16–20px phone; message spacing 12px; bubble padding 12–16px.
- Primary button minimum height 48px, horizontal padding 20–24px; existing rounded pill shape. All interactive target boxes at least 44px tall/wide where practical, including header links and summaries.
- Conversation radius 24px; message bubbles 16px; small cards 16px; closing field 24px. Do not add nested outer cards around every section.
- Decorative separators can be quiet; they must not carry essential state. One restrained shadow on the hero card, e.g. 0 12px 32px with primary navy at 8% opacity. No layered glossy shadows.

### Responsive rules

| Width             | Layout                                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≥1024px           | Split hero, two-column Supervisor, four-step horizontal learning list; teacher steps horizontal only while their text fits                                           |
| 640–1023px        | Hero copy then full-width transcript; learning list 2×2; Supervisor and teacher blocks stack                                                                         |
| <640px            | Single reading column; full-width primary button, teacher text link below; all process lists vertical; phone header with two links                                   |
| 320px / 200% zoom | Allow header/link wrapping and natural height; remove decorative transcript avatars if necessary; no clipped message, horizontal carousel or smaller disclaimer text |

DOM order is header, hero copy, transcript, sequence, Supervisor, teacher workflow, FAQ, close, footer. Do not visually reverse text and transcript without matching reading order. No fixed card heights or line clamping. Use explicit image dimensions/aspect ratio so the robot cannot shift copy during load. Anchor destinations should remain visible after navigation.

## Interaction, motion and accessibility

Everything necessary to understand the page is visible without JavaScript animation or hover. Static transcript is not a live region. Decorative avatars/lines/robot have empty alt when adjacent text already supplies their meaning; wordmark link has an accessible Errby name. The separate Supervisor label must remain visible even without icons/colour.

Use ordinary anchor navigation and native disclosure semantics. Keyboard order follows DOM order. Focus is clearly visible, with an indigo outline and offset on light surfaces; use a contrasting ring when focused on indigo. Hover can change button background/shadow over 120–160ms. Under reduced motion, remove nonessential transitions and smooth scrolling. No looping blink, floating mascot, number animation, typewriter, reveal-on-scroll or autoplay walkthrough.

The local colour guide contains token-level contrast checks; this does not certify the full page. Confirm actual text/background pairs, focus and controls in implementation. Keep low-contrast decorative lines out of functional roles. Ensure one h1 and logical h2/h3 order, no colour-only meaning, selectable message text and working skip navigation. Test 320px widths and 200% text before accepting the page.

## Component choices and minimum custom work

Current official docs were consulted through Context7 resolve→query for shadcn, Animate UI and Magic UI. Local installed components determine what to reuse; see the reference index for documentation links.

| Need                                   | Existing/native solution                                                 | Decision                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Primary/secondary action               | `src/components/ui/button.tsx`; existing link composition with `asChild` | Reuse for anchors; no nested anchor/button or new button abstraction                          |
| Separators                             | CSS border or existing `src/components/ui/separator.tsx`                 | CSS for decorative lines; component only where semantics help                                 |
| FAQ                                    | Native `details`/`summary`                                               | No new Accordion installation                                                                 |
| Transcript / numbered processes        | Semantic ordered lists and plain layout                                  | Necessary custom content, no chat engine or generic timeline package                          |
| Icons                                  | Existing icon dependency and supplied robot identity                     | Small shield/arrow/topic icon; choose one existing icon set per page                          |
| Alternate example switch               | Existing `src/components/animate-ui/components/radix/tabs.tsx`           | Omit from first version: only one approved fictional example is needed                        |
| Expanding-height motion                | Existing Animate UI auto-height primitive                                | Omit: native FAQ communicates without animation                                               |
| Counters                               | Existing Magic UI `src/components/ui/number-ticker.tsx`                  | Omit: no honest adoption/learning statistic exists                                            |
| Browser frame                          | Magic UI Safari documentation reviewed                                   | Omit: consumes transcript width and suggests an app screenshot                                |
| Dialog/tooltips/sidebar/input/skeleton | Existing installed components                                            | Omit: page has no dialog task, hidden essential guidance, app rail, form or loading operation |

Minimum custom work is the original transcript composition, two short ordered lists and responsive section layout. One page plus a few local presentational pieces if readability needs them is enough. No CMS, new package, backend call, tracking service or feature flags are needed for this design. Implementation must read the installed Next.js guides before framework changes, as required by AGENTS.md; this task makes none.

## Estimated hackathon implementation budget

Planning estimate for one developer familiar with this foundation, excluding real product/auth/AI/teacher work:

| Work                                                                   | Estimate      |
| ---------------------------------------------------------------------- | ------------- |
| Page structure, approved copy, anchors, transcript and lists           | 2–3 hours     |
| Existing token/component styling and approved robot asset placement    | 1.5–2 hours   |
| Responsive layout, keyboard/zoom/reduced-motion checks and corrections | 2–3 hours     |
| Final truthful-copy and route/destination review                       | 0.5–1 hour    |
| Total                                                                  | **6–9 hours** |

If the available budget is shorter, keep the semantic content and static roles; omit the hero halo, connector lines, repeated avatars and hover polish first. Do not cut provenance labels, mobile reading size, teacher availability notice, keyboard access or the fourth conversation turn. Generated page images are for review only; they are not a substitute for accessible HTML or production asset exports.

## Future acceptance checklist

Not executed on a landing-page implementation, because no page was built in this task.

- A visitor can read all four turns without clicking; Errby makes the mistake and the student supplies the correction.
- Supervisor has its own name, shield and amber panel; the vignette does not imply the correct hero answer was marked wrong.
- Every example is visibly fictional/unreviewed; no assessment, success/completion or live-tools claim appears.
- Teacher materials, review/publish and class-scoped evidence are explained as planned; independent-session privacy is not contradicted.
- All header/hero/footer links have working in-page destinations; FAQs toggle by mouse and keyboard with correct open-state icons.
- At 320, 390, 768, 1024 and 1440px, and with 200% text, no horizontal overflow, overlapping robot, hidden label or unreadable transcript appears.
- Keyboard focus, skip navigation, headings, disclosure semantics, contrast and screen-reader role labels pass a focused review.
- Reduced-motion preference preserves every message; layout does not depend on animation or image loading.
- No external font, paid model call, pupil data, login or analytics request is introduced by the marketing page.
- A small future comprehension review asks students who made/corrected the error and teachers which tools work today. Report observed answers without inventing a success rate.

## Visual handoff

[Desktop](concepts/desktop.png) · [Mobile upper](concepts/mobile-upper.png) · [Mobile lower](concepts/mobile-lower.png)

The mobile panels are one continuous page split after the four-step sequence for legibility. Generated desktop teacher descriptions and phone secondary text remain approximate raster typography; apply the minimum live-text sizes above. Use approved hex tokens, natural wrapping, consistent avatar treatment and the exact copy in this document when implementation is authorized. Do not reproduce the generated design-review footer in production unchanged.
