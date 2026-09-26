# Errby public landing-page research

17 September 2026 · Research and visual concepts only · No landing-page implementation or publication

## Recommendation

Use **Teach the curious bot**: a calm, light page whose hero shows the actual teaching pattern in four readable turns. Pair a specific learner proposition with one indigo action, give the separate Supervisor its own amber section, then explain the planned teacher workflow. Show the mechanism before asking anyone to trust the product.

This recommendation combines Brilliant's concrete learning example, Notion's short process explanation, Canva Education's explicit audience routes and Instrument's changes in visual density. It preserves Errby's existing identity and makes no claim that those references prove conversion or learning gains. The [implementation specification](LANDING_PAGE_SPEC.md) controls exact wording and layout; the [reference index](REFERENCE_INDEX.md) records all 16 references, screenshots and access limits.

## Project evidence and boundaries

Read first: [setup status](../SETUP_STATUS.md), then [product brief](../specification/PRODUCT_BRIEF.md), [user flows](../specification/USER_FLOWS.md), [learning design](../specification/LEARNING_DESIGN.md), [UI concepts](../specification/UI_CONCEPTS.md), [build brief](../Errby-Build-Brief.md), [colour/screen guide](../Errby-Colour-and-Screen-Guide.md), [screen index](../visual-design/SCREEN_INDEX.md) and [tokens](../visual-design/palette-tokens.json). Local home, Button, Animate UI and Magic UI files were also inspected to bound future implementation effort.

| Repository evidence                                                                                         | Consequence for this page                                                                                                          |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Students teach Errby; Errby can make deliberate mistakes; a visibly separate Supervisor supports correction | The preview must identify who speaks and who corrects whom. A generic chatbot screenshot would hide the differentiator             |
| Primary through high-school learners and teachers; typed English interaction                                | Plain language, readable text and a friendly restrained character. No voice button, audio waveform or age-exclusive school imagery |
| Foundation demo; fictional, unreviewed example; no live evaluation or completed teacher workflow            | Mark examples and plans explicitly. No functioning-looking upload form, fake assessment, class statistics or sign-up success       |
| Required objectives need learner evidence; uncertainty cannot complete lessons                              | No progress completion, grade, mastery badge or teal success state in this fictional interaction                                   |
| Teacher visibility is class-scoped; independent sessions remain private                                     | Teacher copy says “in your class,” not “see everything a student does”                                                             |
| New guide supersedes old palette                                                                            | Light neutral canvas, indigo Errby/actions, amber Supervisor; teal only when evidence warrants progress                            |

The setup's earlier statement that no image binaries existed describes that earlier stage. Images are now present in `docs/Screens_images/`. Visually inspected [Teach Errby today](../Screens_images/Teach%20Errby%20today.png), [student and Supervisor](../Screens_images/Errby%20student%20and%20supervisor%20UI.png) and [teacher materials](../Screens_images/Turn%20materials%20into%20lesson%20drafts.png). These establish the lowercase wordmark, friendly white robot, navy face/cyan eyes, rounded surfaces and role colours. Their interface controls do not establish implemented functionality or expand supported formats.

The current home preview is an app-like learning entry. This brief concerns public discovery. A marketing page should explain why to start; it should not inherit the application sidebar, composer, class state or lesson progress. Routing a future public page and signed-in home remains implementation work.

## Method and evidence quality

The focused set contains **16 references, with seven live pages inspected in depth**. It spans live learning products, agencies, SaaS/product explanation, three Awwwards listings, two Dribbble concepts and the public Mobbin access surface. Full details and direct links are in the index.

Desktop browser viewport: **1280 × 720 CSS px**. Mobile comparison: **390 × 844 CSS px** for Brilliant, Canva Education and Notion. Captures are dated 17 September 2026. Browser screenshots can omit a scrollbar or surface edge; raster dimensions are not substituted for CSS viewport measurements.

- **Observed:** visible composition, text, page structure and confirmed state changes. Reading a site's own claim verifies that the claim exists, not that it is true.
- **Measured:** selected desktop computed CSS and bounding rectangles returned valid values. Values are captured at that moment; responsive fonts and loading can change them.
- **Estimated:** spacing, widths and proportions judged from screenshots, generally rounded to an 8px range. These are not extracted design tokens.
- **Interpretation:** a reason the observed choice may help communication. No causal conversion or usability conclusion follows from it.
- **Recommendation:** a deliberate Errby decision, subject to future comprehension and accessibility testing.

No accounts were created, no protected flows accessed, no pupil research conducted and no analytics obtained. Awards establish recognition; Dribbble shots establish visual intent. Neither is evidence that an interface works well for children or converts visitors.

## Seven detailed live-page studies

### 1. Brilliant — make the learning method concrete

**Observed:** [Brilliant's homepage](https://brilliant.org/) pairs a large left-aligned serif proposition with a contained mathematical learning preview. A green learner action has greater visual weight than the adult entry. The page continues through proof, a visual tutor explanation, subjects, learning routine/experts, testimonials, another action and a grouped footer. Lower down, a graph illustration sits beside a short explanation rather than a dense feature grid. [Hero](screenshots/01-brilliant-desktop.png) · [detail](screenshots/01-brilliant-detail.png) · [mobile](screenshots/01-brilliant-mobile.png).

**Measured:** desktop h1 76px, 79.8px line height, weight 500, box about 590px wide beginning x=92.5px. First sampled h2 60/66px; another 50/55px. **Estimated:** broad two-column balance, roughly 80–96px outer breathing room and larger gaps between stories than within copy groups. Light panels isolate coloured diagrams; navigation is compact and pill-shaped. On the mobile capture the media area precedes a centered headline and stacked role actions. Its media was blank while loading; this is a capture limitation, not an intentional blank region.

**Interpretation:** a specific example lets visitors infer what learning feels like before entering a flow. The adult route stays discoverable without competing equally with the learner route. The first desktop screen communicates both category and method; the phone needs more scroll to do so.

**Errby adaptation:** show all four teaching turns in one contained panel; one primary action and a text teacher route. Do not import the tutor promise, serif identity, green CTA, streaks, institution logos or efficacy claims. Errby's mobile headline comes before its example to establish context immediately. A learner action was clicked during research, but onboarding completion was not verified.

### 2. Khanmigo — explain roles without merging them

**Observed:** [Khanmigo](https://www.khanmigo.ai/) uses a lavender hero, a headline with changing text and a collage of people/character imagery. Role-focused navigation and cards lead to teachers, districts and other offerings. Alternating explanatory blocks, testimonials, FAQ, a talk/video, a dark closing action area and footer follow. [Desktop](screenshots/02-khanmigo-desktop.png) · [full page](screenshots/02-khanmigo-full.png).

**Measured:** sampled h1 48px with 52px line height, approximately 730px wide at x=267.5px. **Estimated:** centered hero with imagery spread around it; audience cards increase density below the introductory area; later two-column sections give copy and imagery roughly equal roles. Rounded panels and pale colour fields group information more than heavy shadows. The changing headline was observed; duration and reduced-motion behaviour were not tested. Cookie controls initially obscured content and were dismissed. FAQ click did not confirm expansion.

**Interpretation:** audience labels help adults locate relevant information, but many equal routes and rotating copy impose more decisions. The next section makes audience differentiation explicit rather than leaving it inside a menu.

**Errby adaptation:** one clearly named teacher section, followed by concise objections. Put Supervisor guidance outside the hero so the learner's four-turn mechanism remains legible. Do not copy the rotating headline, collage, districts funnel or testimonial-based trust. No mobile conclusions are claimed for this reference.

### 3. Duolingo — character with an action hierarchy

**Observed:** [Duolingo](https://www.duolingo.com/) places a large character/phone illustration on the left and a compact bold proposition on the right, above a green new-user action and an outlined existing-account action. A course/language strip introduces subsequent alternating illustration/benefit stories; app, subscription and other product sections lead to a closing invitation and grouped footer. [Hero](screenshots/03-duolingo-desktop.png) · [benefit section](screenshots/03-duolingo-detail.png).

**Measured:** desktop h1 32px with computed line height “normal,” box about 480px at x=646.5px; sampled h2 48px with “normal” line height. **Estimated:** hero visual occupies about half the composition; generous white separation lets each coloured illustration carry one idea. Strong button edges and round forms are more prominent than translucent effects. The lower benefits use green headings and another contained character illustration.

**Interpretation:** the character attracts attention while the separate text region remains readable. Its distinctive tone depends on consistent illustration and language rather than maximum headline size. Navigation does not try to expose the whole product in the first screen.

**Errby adaptation:** reuse Errby's own robot as a small guide and recognizable closing motif. Keep the conversation dominant. Do not transfer language selectors, rewards, account actions without working destinations or childlike character scale across every section. No mobile or timing audit was performed. Full-page capture stretched viewport-relative layout, so only ordinary viewport captures inform spacing.

### 4. Canva Education — label the audience at the decision

**Observed:** [Canva Education](https://www.canva.com/education/) uses a centered education proposition, a purple/cyan background wash, explicit Teachers/Schools/Students actions and a broad product preview. Benefits lead into feature disclosures and imagery, role/verification information, campus/integration/resource areas, testimonials, CTA, FAQ and a large footer. [Desktop](screenshots/07-canva-desktop.png) · [mobile](screenshots/07-canva-mobile.png).

**Estimated only:** desktop headline approximately 56–60px; mobile about 32px. Desktop side room approximately 48px, mobile about 24px. A wide visual below short hero copy introduces the next area. Soft background colour and rounded containers distinguish audiences while black type remains the strongest reading element. On a 390px phone, navigation collapses and audience actions stack: purple teacher action, dark school action and lighter student text route. Product imagery follows rather than competing horizontally.

**Interpretation:** the action itself tells a visitor whether it applies to them. Stacking preserves labels better than hiding all audience choice inside a mobile menu. An extensive page is justified by Canva's existing breadth, not by Errby's current scope.

**Errby adaptation:** keep “For teachers” visible; use “Explore the teacher plan” beside the learner-oriented example action. Collapse layout, not audience meaning, on phones. Do not transfer “free,” eligibility, integrations, campus features or broad adoption claims. DOM viewport readings were invalid and discarded; no numerical CSS measurements are claimed.

### 5. Notion Sites — demonstrate a short process

**Observed:** [Notion Sites](https://www.notion.com/product/sites) opens with a specific centered proposition, a dark primary action and a restrained line illustration. Three numbered steps lead into a browser-framed product demonstration. Selecting “Personalize it” changed the visible preview to a settings-oriented state. Templates and product benefits precede upgrades, a final action and footer. [Hero](screenshots/11-notion-desktop.png) · [selected step](screenshots/11-notion-product.png) · [mobile detail](screenshots/11-notion-mobile.png).

**Estimated only:** headline around 52px, central content around 1000px, desktop outer room around 120px. Sparse copy contrasts with the denser application preview. Fine borders and neutral surfaces frame the product; the preview, not decorative depth, supplies detail. On mobile, navigation is compact with a primary action still present. In the inspected scrolled state, part of the next step label is clipped and the embedded product UI is small.

**Interpretation:** short action labels make a process scannable. A selectable preview can connect labels to outcomes, but hidden steps and miniature UI can undermine discovery on a narrow screen.

**Errby adaptation:** display the whole four-step sequence and transcript without requiring clicks, playback or horizontal scrolling. Borrow process clarity, not a browser chrome frame, templates carousel or publishing claims. Timing, video playback quality and mobile hero typography were not verified. Invalid DOM numerical readings were discarded.

### 6. Instrument — change density with purpose

**Observed:** [Instrument](https://www.instrument.com/) uses a very large black wordmark, compact pill navigation and a strong orange showreel region. Project blocks lead to client/service information, recognition, an oversized serif purpose statement, news and footer. The page alternates image-heavy areas with sparse editorial statements. [Desktop](screenshots/05-instrument-desktop.png) · [full page](screenshots/05-instrument-full.png).

**Estimated:** outer gutters around 56px; work-grid gaps roughly 16–24px; major vertical gaps roughly 80–160px. Large media and typography share alignment lines despite changing density. The orange field and black/white sections make changes of subject visible without enclosing every block in a card. Motion/media is present, but no playback duration, hover sequence or reduced-motion audit is claimed. A cookie notice remains visible in the capture.

**Interpretation:** shared edges create continuity; differences in density tell the reader when the subject has changed. A reel and huge masthead suit an agency selling craft, but would postpone Errby's explanation.

**Errby adaptation:** hero at medium density, slim sequence, quieter Supervisor section, practical teacher workflow, compact FAQ. Use one pale-indigo closing field. Do not copy the masthead scale, reel-first opening, service copy, client roster or award strip. Desktop evidence only.

### 7. COLLINS — hierarchy through type and empty space

**Observed:** [COLLINS](https://www.wearecollins.com/) starts with a large centered serif statement on an off-white field, small branding/menu and recognition cues. Programs lead into work/case-study content, arts and contact/footer. A lower programs view places a short introduction alongside broad horizontal rows; one “Reposition” row is dark. [Hero](screenshots/06-collins-desktop.png) · [programs](screenshots/06-collins-detail.png).

**Measured:** h1 72/72px; its element box spans about 1229px beginning x=18px. This box is not the glyph width or a recommended reading measure. **Estimated:** very narrow outer page gutters around 18px coexist with a large empty center; the headline's meaning carries the first screen. Lower rows are markedly denser. The normal viewport capture, not the distorted full-page image, is the spacing source. A horizontal scrollbar appeared in this browser.

**Interpretation:** fewer type levels and clear rows can create a deliberate editorial voice. Abstract copy and extreme blank space are much less useful when a visitor does not yet understand a novel learning interaction.

**Errby adaptation:** restrained hierarchy, section headings aligned to content edges and a simple process row. Avoid serif imitation, ambiguous slogans, huge unused first-screen space and the overflow behaviour. No specific hover mechanism or mobile behaviour was verified.

## Cross-reference comparison

| Communication problem                  | Strongest observed reference                          | Errby decision                                                             | Evidence limit                                                 |
| -------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Explain an unfamiliar learning method  | Brilliant's contained learning example                | Four readable turns beside the proposition                                 | Comprehension benefit is a design hypothesis                   |
| Separate students and teachers         | Canva's role actions; Khanmigo's role sections        | One learner-oriented primary action, named teacher link/section            | No conversion split or audience research obtained              |
| Explain the order of actions           | Notion's numbered manual demonstration                | Static, fully visible sequence; no autoplay                                | Notion's manual state change was observed; no completion study |
| Make a character useful                | Duolingo's separated illustration and copy            | Small existing robot; text remains dominant                                | Appeal to every school age is untested                         |
| Give the page rhythm                   | Instrument's density changes; COLLINS' type hierarchy | Alternate transcript, light sequence, role explanation, practical workflow | Spacing mostly estimated; agency goals differ                  |
| Add visual personality                 | Dribbble Ouano/MUSE concepts                          | Controlled illustration and one accented headline clause                   | Static/concept appeal is not usability proof                   |
| Show a story sequentially              | Honda award listing's described timeline              | Ordinary numbered steps                                                    | Live 3D behaviour was not inspected                            |
| Communicate AI without a vague promise | Catalyze listing and MagicSchool's role copy          | Specific learner and teacher tasks                                         | Supporting listing/text evidence only                          |

Mobbin's protected app flows were not available. Its accessible public page is documented, but no onboarding recommendation is attributed to an unseen Mobbin flow. Brilliant, Canva and Notion's public pages supply the usable discovery evidence. Linear's screenshot failure prevents using it as a measured visual reference; Pentagram supports only the general project-story emphasis seen in accessible text.

## What creates the desired feel

**Observation:** the most relevant pages distinguish a readable text layer from contained visual detail. They group short copy tightly and separate major stories more generously. Character and colour work best when attached to a specific product idea. Large agency type creates emphasis but does not, by itself, explain a product.

**Interpretation:** Errby's “macOS-inspired” quality should mean consistent edges, clear type, quiet neutral surfaces, stable controls and restrained depth. It should not mean copying an operating-system window, making text translucent or adding a glass effect to every card.

**Recommendation:** use a 1200px maximum container, generous but bounded section spacing, strong heading/body hierarchy, one white conversation panel and precise colour meaning. A subtle halo can sit behind the opaque hero preview. Fine borders organize static information; darker borders and visible focus distinguish actual controls. Avoid a wall of interchangeable feature cards. Reserve amber for the Supervisor and pending review; reserve teal for real evidenced progress, absent in this example.

Motion is unnecessary to communicate the loop. All four messages should appear immediately. A future hover colour transition is sufficient; remove even that under reduced-motion preference. Do not reveal critical words through typing, looping carousel, scroll hijacking or cursor effects. No reference's animation timing was used as a measured requirement.

## Two plausible directions

|                        | A — Teach the curious bot                                                      | B — The mistake is your cue                                                                     |
| ---------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Composition            | Specific left headline, right transcript; small robot; role sections below     | Large editorial question, then four sequential annotated panels with a larger robot moment      |
| Visual emphasis        | Product example and plain explanation; indigo actions, separate amber guidance | Navy typography and indigo error/correction emphasis; neutral stage, amber Supervisor interlude |
| Reference influence    | Brilliant, Notion, Canva Education, restrained Instrument pacing               | COLLINS' type emphasis, MUSE's editorial pacing, Honda's described sequence                     |
| Student communication  | Full mechanism visible in one panel                                            | More theatrical reveal; mechanism unfolds over more scroll                                      |
| Teacher communication  | Immediate teacher route; practical planned workflow                            | Teacher route still present, but storytelling takes more vertical space                         |
| Motion                 | None needed                                                                    | Can remain static; temptation to animate is a cost risk                                         |
| Estimated build budget | 6–9 focused hours, using existing components/assets                            | 9–13 hours for staged composition, responsive art direction and additional QA                   |
| Main risk              | Transcript becomes too small if treated as an image                            | Visitors mistake a slogan/illustration for a generic AI tutor; delayed explanation              |

**Recommend A.** It prioritizes Errby's distinctive mechanism, uses assets already available and has the fewest moving parts. B remains a viable campaign direction after the core interaction is understood, not an additional page to build now. These are planning estimates, not delivery commitments or measured productivity.

## Decision traceability

1. **Specific headline plus four turns:** Brilliant and Notion show concrete methods; local learning design establishes the actual sequence. The words and composition are original to Errby.
2. **Primary “See an example”:** the foundation has no live lesson or sign-up path. Current product evidence, not competitor convention, determines the conversion action.
3. **Visible teacher route:** Canva/Khanmigo show audience specificity; Errby's planned teacher workflow supplies the content. No district sales funnel is added.
4. **Separate amber Supervisor:** established local role tokens take precedence over external references. Separation prevents readers mistaking support for Errby's deliberate error.
5. **Small robot and restrained depth:** Duolingo demonstrates a character's role; Errby's supplied artwork supplies identity. The robot accompanies a transcript rather than replacing it.
6. **Density changes without extra sections:** Instrument informs pacing; COLLINS informs heading discipline. No client logos, awards, statistics or generic services are added to fill space.
7. **Mobile vertical transcript and lists:** inspected Canva/Brilliant stacking and Notion's clipped process provide reasons to keep content visible and avoid tiny app screenshots.
8. **Static baseline:** full comprehension requires the sequence, not motion. Existing native layout and controls cover the brief within the estimated budget.

## Concepts, review and remaining validation

- [Desktop concept](concepts/desktop.png)
- Matching mobile concept in two coordinated panels: [upper](concepts/mobile-upper.png), [lower](concepts/mobile-lower.png)
- [Exact generation/edit prompts and visual QA](LANDING_PAGE_IMAGE_PROMPTS.md)

The image tool generated the concepts using existing Errby identity references. Review checked wordmark/robot, speaker order, mistake/correction, separate Supervisor, truthful fictional/planned labels and page order. Mobile was revised for larger relative type and stronger wrapping; a generated material-link claim was corrected to the specified text/PDF wording. Original drafts remain named `*-v1.png` for traceability.

These are art-direction images, not browser renderings. Raster text sizes, line breaks, shadows and colour fidelity do not establish implementation values. The written specification requires live HTML text, larger supporting type than some dense generated desktop rows, and natural mobile wrapping. The image's illustrated learner face is decorative, not a product identity requirement; use a neutral labelled avatar in implementation.

Still untested: whether students across the age range correctly identify the deliberate error; whether teachers distinguish the planned tools from the working demo; actual CTA usage; screen-reader flow; low-vision/zoom behaviour; real device layout. A small moderated review should ask a learner “Who made the mistake, and what did the student do?” and a teacher “Which tools can you use today?” Record responses rather than inventing success rates. Future acceptance checks are in the spec. No build, deployment or product integration was carried out in this research task.
