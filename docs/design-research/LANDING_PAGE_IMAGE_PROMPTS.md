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

## Mobile, continuation — exact generation prompt

```text
Use case: ui-mockup.
Create PANEL 2 of the Errby MOBILE PUBLIC LANDING PAGE, continuing directly after its four-step explanation. Use the supplied desktop concept for visual identity. Flat narrow mobile webpage only, no device frame. Portrait aspect ratio 1:3.4, target 768x2600. IMPORTANT: use true phone scale: design as 390 CSS px wide at 2x, with 20px CSS side gutters, body 17px CSS (34 image pixels), headings 28px CSS (56 image pixels). Reflow text into short lines. It must not resemble a desktop page shrunk into a phone. All sections single column, no side-by-side blocks.
Palette exact intention: #F7F9FC canvas, #FFFFFF cards, navy #17223B, supporting #526179, #4F46E5 CTA, pale #EEF2FF. Amber #FFF7E6 panel, #92400E text, #B45309 border for Supervisor only. Same system sans serif and gentle 16px CSS radii as reference.
Show these sequential sections only:
1. Heading “A second voice when you need it.” Copy “The planned Supervisor is separate from Errby. It helps address misconceptions and flags uncertainty.” Under copy show an AMBER full-width panel with shield icon, “Supervisor”, “Fictional guidance example”, “Let’s check where the heat comes from.” and “If a claim cannot be verified, it stays unresolved.”
2. Eyebrow “FOR TEACHERS · PLANNED WORKFLOW”, heading “Your materials. Lessons you review.” Copy “Create a class, add material, review lesson drafts, then publish selected lessons.” Five compact vertically stacked process labels: “Create class”, “Add material”, “Review”, “Publish”, “Review evidence”. One small neutral draft card: “Heat transfer” and “Draft · needs teacher review”. Notice “These teacher tools are planned and are not available in the current demo.” No upload control and no file format claims.
3. Heading “A few things to know.” Three FAQ items with answers shown at readable phone size:
“Is this a live lesson?” / “No. This is a fictional, unreviewed example.”
“Why does Errby make mistakes?” / “So you can practise spotting and explaining them.”
“Does the Supervisor mark work?” / “It is designed to guide and flag uncertainty, not provide high-stakes grades.”
4. Closing pale indigo block: small white Errby robot with navy face/cyan eyes/lilac antenna, headline “What would you teach Errby?” and full-width indigo “See an example →”.
5. Footer lowercase wordmark “errby.”, links “How it works”, “For teachers”, “Questions”, and “Design concept · September 2026”.
No extra headline or top navigation because this is page continuation. No scores, success badges, school logos, testimonials, guarantees, pricing, signup, fake endorsements. Do not squash paragraphs to fit: use a tall canvas and short line lengths.
```

Reference: generated `concepts/desktop.png`; continue the upper panel's identity and section order.

## Mobile upper revision — exact edit prompt

```text
Edit this MOBILE Errby upper-page concept to correct phone-scale typography and wrapping. Preserve brand, palette, robot identity, all four conversation turns and their speaker labels, content order and primary CTA. Render a NARROW 390 CSS pixel mobile page, with visibly larger body text relative to page width: about 22 characters per text line in the conversation, 17 CSS px body and 36 CSS px main headline, 20 CSS px side padding. Tall portrait aspect about 1:3.5. Headline MUST wrap exactly into five lines: “Teach Errby.” / “Catch its” / “mistakes.” / “Explain your” / “thinking.” Colour only lines 2 and 3 indigo. The supporting paragraph should wrap to four or five lines, not two. Full-width CTA. Header wordmark and just “Teachers” and “Questions”, readable compact. Robot at most 50 CSS px beside conversation title, not floating over bubbles. Messages each take 2–4 lines, label Errby or You always distinct. Do not remove “Fictional example · unreviewed”, “Illustrative preview · not a live lesson” or “Example only · no assessment”. Retain the vertical 01–04 list after the card, or lengthen canvas to fit it. This is a readable phone design, not a scaled desktop/tablet. No new wording or features.
```

Edit target: `concepts/mobile-upper-v1.png`. Reason: first output read like a narrow tablet; increase type relative to width and require phone wrapping.

## Mobile lower revision — exact edit prompt

```text
Edit this Errby MOBILE lower-page concept to match a 390 CSS pixel phone with 20px side gutters, 17px body text, and 30px section headings. Make all text visibly larger relative to the page width, with body lines roughly 25–35 characters. Preserve all sections, role labels, palette, robot identity, fictional labels and planned-tools notice. Tall portrait canvas. Force the first heading to wrap as “A second voice” / “when you need it.” and the teacher heading as “Your materials.” / “Lessons you review.” Replace the Add material description exactly with “Add a topic list or text/PDF material.” No link upload claim. Use a compact amber Supervisor panel with shield icon and unchanged guidance text; never show completion or grading. Teacher steps remain a vertical list. Use “Create a class, add material, review lesson drafts, then publish selected lessons.” as teacher introduction. Keep the review-evidence step and draft card. FAQ answers stay readable; keep all three questions and answers, allow extra canvas height. Closing heading should wrap to two lines and button full width. Keep white and pale canvas surfaces; remove unnecessary outer card borders around whole sections so it reads as one continuous page. No new features, credentials, adoption claims, or testimonials.
```

## Desktop wording revision — exact edit prompt

```text
Edit this full-page desktop Errby landing-page concept with minimal changes. Preserve composition, all sections, colours, robot identity, exact four-turn conversation and role labels, fictional example notices, Supervisor separation, planned teacher tools notice and CTA. Correct the small description under teacher step “Add material”: replace “Add a topic list or link to material.” with exactly “Add a topic list or text/PDF material.” Keep it legible and wrap within its column. Do not add link import, new features, metrics, completion or endorsement claims. Improve the tiny teacher-step text slightly if space allows without changing the whole-page layout. Everything else remains the same.
```

## Generation record and visual QA

All six generation/edit calls completed on 17 September 2026 using the built-in image tool. No external image API or application model integration was used. Original tool outputs remain in the generated-images directory; workspace copies below are the review deliverables.

| Output                                                   | Inputs                                                                                                             | Review result                                                                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Desktop first draft](concepts/desktop-v1.png)           | Existing `docs/Screens_images/Teach Errby today.png` and `docs/Screens_images/Errby student and supervisor UI.png` | Correct wordmark/robot, four-turn speaker order, separate Supervisor and planned teacher section. Generated “link to material” wording required correction |
| [Mobile upper first draft](concepts/mobile-upper-v1.png) | First desktop draft                                                                                                | Correct content; too much tablet-like line length and small relative text                                                                                  |
| [Mobile lower first draft](concepts/mobile-lower-v1.png) | First desktop draft                                                                                                | Correct section order; headings too wide; repeated material-link wording needed correction                                                                 |
| [Mobile upper final](concepts/mobile-upper.png)          | Upper first draft, exact revision prompt above                                                                     | Five-line heading and larger message type; four roles/turns and all example notices retained                                                               |
| [Mobile lower final](concepts/mobile-lower.png)          | Lower first draft, exact revision prompt above                                                                     | Multi-line headings, vertical teacher steps, text/PDF wording, separate amber guidance and planned notice retained; unnecessary section wrappers removed   |
| [Desktop final](concepts/desktop.png)                    | Desktop first draft, exact wording revision above                                                                  | Material description corrected; all core roles, CTA hierarchy and availability labels retained                                                             |

Visually inspected all outputs. Final checks: Errby asks first; You explains; Errby makes the labelled deliberate mistake; You corrects it. The Supervisor is outside that transcript, uses a shield/amber treatment and does not award completion. No school logos, statistics, endorsements, live inputs or fabricated grades were added.

Remaining image limitations: these are raster art-direction concepts, not screenshots at a verified CSS viewport. The tool did not obey exact requested canvas dimensions or all phone gutters/type sizes; mobile panels retain more side whitespace than the specified 20px gutters. Body text must use the spec's live 17px size when implemented. Exact hex fidelity is unverified. The generated FAQ chevrons do not consistently communicate open state; native disclosures must do so. Generated learner portraits are decorative, not approved student identity assets. The written spec uses a neutral avatar, natural wrapping and one teacher introduction across devices; the desktop's longer teacher introduction expresses the same plan but is superseded by that exact copy.

Do not ship the whole-page image as the website. Keep prompts verbatim, including superseded drafting choices, for reproducibility; use [LANDING_PAGE_SPEC.md](LANDING_PAGE_SPEC.md) for the final decisions.
