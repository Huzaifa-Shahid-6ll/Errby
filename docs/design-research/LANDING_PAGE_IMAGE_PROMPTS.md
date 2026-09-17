# Landing page image prompts

17 September 2026. Built-in imagegen; UI concepts, not app screenshots. Written specification controls wording, roles and exact tokens. Existing reference images supply identity only.

## Desktop — exact generation prompt

```text
Use case: ui-mockup.
Create a high-fidelity original DESKTOP PUBLIC MARKETING LANDING PAGE concept for Errby, not the signed-in app. Flat front view, one tall page, no device frame, no perspective. Aim for 1536 pixels wide by 2560 pixels tall with legible copy and restrained spacing.
Input images: the supplied Errby home and session screens are IDENTITY references only: preserve lowercase errby. wordmark, small friendly white rounded robot with navy face, cyan eyes and lilac antenna, indigo primary actions. Do not copy the sidebar or app composer.
Direction: “Teach the curious bot”. Light macOS-inspired calm surfaces, crisp system sans serif, navy #17223B type, #526179 secondary text, #F7F9FC canvas, white opaque cards, indigo #4F46E5 CTA, #EEF2FF bot bubbles. Subtle blue/lilac halo ONLY behind hero preview. Amber #FFF7E6/#92400E/#B45309 ONLY separate Supervisor section. Teal reserved for evidenced progress; this unreviewed fictional demo has NO completed goals, scores or success badges.
Original art direction: narrow horizontal nav, 1200px content max, 80px side gutters, deliberate left alignment, hero split 44/56, 64px bold heading, 18px body equivalent. No endless bento grid, oversized orb or dashboard.
SECTION ORDER AND EXACT COPY:
1. Header: wordmark “errby.” left. Links “How it works”, “For teachers”, “Questions”. Right small indigo button “See an example”.
2. HERO left: small label “A learning app in development”; heading split into three lines “Teach Errby.” / “Catch its mistakes.” / “Explain your thinking.” First line navy, second indigo, third navy. Supporting paragraph: “You do the explaining. Errby asks questions and sometimes gets things wrong on purpose.” Primary button “See an example →”; secondary link “Explore the teacher plan”. Tiny note “Illustrative preview · not a live lesson”.
Hero right: one opaque rounded white conversation window with a small robot integrated near top corner, never covering text. Header “Why does ice melt?” and small subtitle “Fictional example · unreviewed”. Show four rows IN THIS EXACT ORDER with explicit speaker labels:
“Errby” — “Why does ice melt in a warm room?”
“You” — “Heat moves from the warmer room into the ice.”
“Errby · deliberate mistake” — “So the ice makes its own heat?”
“You” — “No. The energy comes from the warmer surroundings.”
Errby rows pale indigo, You rows light neutral. No input bar. Footer of card “Example only · no assessment”.
3. Below hero a slim horizontal four-step sequence, connected by subtle thin rules, labels “01 Errby asks”, “02 You explain”, “03 Spot the mistake”, “04 Correct it”. Small heading “A different way to practise.” No redundant feature cards.
4. White section “A second voice when you need it.” Left short copy “The planned Supervisor is separate from Errby. It helps address misconceptions and flags uncertainty.” Right AMBER bordered panel with shield icon, visible “Supervisor”, small “Fictional guidance example”, text “Let’s check where the heat comes from.” and “If a claim cannot be verified, it stays unresolved.” This is a separate explanatory vignette, not a fifth speaker in the hero conversation.
5. Pale neutral teacher section, eyebrow “FOR TEACHERS · PLANNED WORKFLOW”. Heading “Your materials. Lessons you review.” Copy “Create a class, add a topic list or material, review lesson drafts, then publish selected lessons. Review what students can explain in your class.” A refined horizontal editorial process “Create class → Add material → Review → Publish → Review evidence”, and one small illustrative draft card “Heat transfer” / “Draft · needs teacher review”. Clear note “These teacher tools are planned and are not available in the current demo.” No upload control, school logos, chart, pupil data or fake metrics.
6. “A few things to know.” Three elegant FAQ rows with visible brief answers, no giant blocks:
“Is this a live lesson?” — “No. This is a fictional, unreviewed example.”
“Why does Errby make mistakes?” — “So you can practise spotting and explaining them.”
“Does the Supervisor mark work?” — “It is designed to guide and flag uncertainty, not provide high-stakes grades.”
7. Closing pale indigo band “What would you teach Errby?” button “See an example →”. Footer “errby.” and “How it works · For teachers · Questions”; small “Design concept · September 2026”.
No fabricated testimonials, awards, partners, ratings, proven gains, free claims, login/sign-up buttons, integrations, voice input, confetti. No illegibly tiny legal copy. Keep all meaningful text on solid surfaces. Written spec is authoritative. Produce a detailed plausible website composition, not a mood board.
```

Reference paths: `docs/Screens_images/Teach Errby today.png` and `docs/Screens_images/Errby student and supervisor UI.png`.

## Mobile, upper panel — exact generation prompt

```text
Use case: ui-mockup.
Generate the MOBILE adaptation of the supplied Errby DESKTOP landing-page concept, which is the design reference. One flat tall mobile web page image, no phone hardware, 390 CSS px content width represented at high pixel density, ideally 1024x2400. This is PANEL 1 OF 2: show header, hero, entire four-message conversation, four-step explanation; end after that section. Do NOT squeeze the whole website into this image. Same lowercase errby. wordmark, white rounded robot/navy face/cyan eyes/lilac antenna, indigo #4F46E5, navy #17223B, white cards and #F7F9FC canvas. White solid text surfaces, tiny lilac halo behind conversation only, system sans-serif. 20px equivalent side gutters, body 17px equivalent, heading 36px equivalent, 48px-tall primary CTA. No cropped text, device bezel, perspective or browser bar.
Header wordmark and visible simple text links “Teachers” and “Questions”. Hero eyebrow “A learning app in development”. Headline on natural short lines “Teach Errby. Catch its mistakes. Explain your thinking.” Make “Catch its mistakes.” indigo. Copy “You do the explaining. Errby asks questions and sometimes gets things wrong on purpose.” Full-width indigo button “See an example →”; secondary “Explore the teacher plan”; note “Illustrative preview · not a live lesson”.
Below hero, a readable full-width white conversation card; small robot next to title, never covering content. Header “Why does ice melt?” and “Fictional example · unreviewed”.
Four rows exactly in order, wide message bubbles and visible labels, pale indigo for Errby and neutral for You:
“Errby” — “Why does ice melt in a warm room?”
“You” — “Heat moves from the warmer room into the ice.”
“Errby · deliberate mistake” — “So the ice makes its own heat?”
“You” — “No. The energy comes from the warmer surroundings.”
Footer “Example only · no assessment”. No input field or send button, scores or completion.
Then “A different way to practise.” and a compact vertical numbered list: “01 Errby asks”, “02 You explain”, “03 Spot the mistake”, “04 Correct it”.
No Supervisor message within this transcript; that separate role appears on the following image. No teacher controls, fabricated statistics, testimonials, awards or claims. Make this recognizably the same page as the desktop, reflowed instead of shrunk.
```

Reference: generated `concepts/desktop.png`.
