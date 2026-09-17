# Errby — colour research and screen design guide
17 September 2026 · Design recommendation v2 · Proposed visual concepts, not a working application.

## Recommendation
Use a cool neutral foundation with indigo for Errby/primary actions, amber for the Supervisor and teal for demonstrated progress. Start classroom testing with a light reading surface; offer a matching dark option. Keep the user's futuristic halo on the home screen and reduce it during conversation, source review and analytics.

This is the recommended fit for Errby's mixed primary/middle/high-school audience and supplied Lovable references. Research does not identify a universally best hue, exact hex code or theme for all children. The palette and theme default are design inferences, not experimentally proven learning interventions.

This supplement supersedes the earlier provisional palette and dark-first recommendation in the implementation pack. It changes presentation recommendations only; it does not remove school uploads, typed teaching, the supervisor, or evidence-based analytics.

## How the research was used
Consensus was searched for children's app colours, emotional design in learning, display polarity, and distracting visual decoration. Eight selected paper records/abstracts were fetched before citation. W3C accessibility guidance was checked separately. This is a targeted evidence review, not an exhaustive systematic review and not a claim to have read every paper's full text. Screen concepts use the previously supplied Lovable images and existing Errby identity; a newly promised image had not been supplied when these concepts began.

| Finding | What the evidence actually supports | Errby decision / limit |
| --- | --- | --- |
| Emotional design | A meta-analysis reports modest average benefits from combined emotional-design features; a later systematic review finds mixed learning results but more consistent motivation/emotion findings. [1][2] | Give Errby a friendly face and restrained colour. Do not claim indigo or a robot guarantees retention. |
| Attraction is not learning | In a study of 53 children aged 9–11, the more attractive educational game was preferred but did not improve measured learning. [3] | Evaluate task completion and explanation quality separately from “looks cool.” |
| Existing children's apps | A catalogue study of 223 child-oriented and 58 adult apps found different hue/saturation/brightness usage. It measured app designs, not what children learn best from. [4] | Avoid treating common bright palettes as proof of effectiveness. |
| Decorative competition | A laboratory kindergarten classroom study found more distraction and smaller learning gains with heavily decorated walls. [5] | Keep the halo away from lesson text. Classroom-to-screen transfer is an inference, not direct UI evidence. |
| Light versus dark | One proofreading study favoured positive polarity, particularly for small characters; another small adult study found faster reading under negative polarity without a reading-error difference. [6][7] | Prefer a light classroom starting point with user choice. Neither is a child-specific mandate. Keep text large in both. |
| Relevance of colour | A study including university and secondary-school samples examined colour together with learning relevance and reported interacting effects. [8] | Colour should identify the current action, speaker or concept state, rather than decorate every element. |

No gender-coded palettes, “blue makes children smarter” claim, or promise of improved school attainment follows from these sources.

## Exact recommended palette
| Purpose | Light mode | Dark mode | Usage |
| --- | --- | --- | --- |
| Canvas | #F7F9FC | #121722 | Quiet surrounding workspace |
| Reading surface | #FFFFFF | #1C2433 | Solid opaque surfaces beneath text |
| Main text | #17223B | #F4F7FC | Explanations, headings, inputs |
| Secondary text | #526179 | #B7C2D6 | Supporting labels; never faint essential text |
| Primary action | #4F46E5 | #A5B4FC | Prepare, start, send, save |
| Text on primary | #FFFFFF | #17223B | Contrast-qualified button labels |
| Errby surface | #EEF2FF | #242B48 | Small speaker/message treatment |
| Errby text | #4338CA | #C7D2FE | Name and identity |
| Supervisor surface | #FFF7E6 | #33291B | Separate intervention panel |
| Supervisor text | #92400E | #F5D08A | Calm explanatory message |
| Supervisor edge/icon | #B45309 | #E9AE4C | Role boundary plus shield icon |
| Success surface | #ECFDF5 | #15332E | Confirmed objective/result only |
| Success text | #0F766E | #99E2CF | Explained state, check icon |
| Error surface | #FFF1F0 | #3A2028 | Operational failures/destructive context |
| Error text | #B42318 | #FFC1BA | Never the routine colour of a student mistake |
| Required control boundary | #77859B | #697B98 | Visible fields and controls |

The blue/lilac home halo is optional decoration. Render it behind the main composer region, with solid composer and lesson surfaces. It is not a source of semantic meaning. The mockup generator may approximate hex values; the token file is authoritative.

## Speaker and feedback semantics
- **Errby:** indigo/lilac, robot marker, visible name. Curious, concise questions.
- **Student:** neutral surfaces and “You.” Do not make correct students green and incorrect students red.
- **Supervisor:** amber panel, shield marker, explicit role/title. It is supportive guidance, not punishment.
- **Verified progress:** teal and a check plus “Explained.” This is separate from the Supervisor's amber identity.
- **Unverified:** amber notice with explicit uncertainty wording and review action. Never celebrate unresolved facts.
- **System error:** separate red treatment for an upload failure, lost connection or destructive action; not learner worth.

Colour alone must not convey who speaks, whether a concept is understood, or whether an input is invalid. Include labels, shape/icon and where useful text. [W3C use of colour](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).

## Contrast verification
The exact solid foreground/background tokens were tested mathematically with the WCAG relative-luminance formula. All 22 selected pairings pass their assigned thresholds. These checks do not certify complete screens, accessibility of the image mockups, or future CSS implementations.

| Pair | Ratio | Threshold checked |
| --- | --- | --- |
| Light main text / white | 15.81:1 | 4.5:1 |
| Light supporting text / white | 6.28:1 | 4.5:1 |
| White / indigo button | 6.29:1 | 4.5:1 |
| Light Supervisor text / panel | 6.65:1 | 4.5:1 |
| Dark main text / surface | 14.49:1 | 4.5:1 |
| Dark button label / lavender | 7.93:1 | 4.5:1 |
| Dark Supervisor text / panel | 9.68:1 | 4.5:1 |
| Required control edge / light white | 3.74:1 | 3:1 |
| Required control edge / dark surface | 3.62:1 | 3:1 |

Normal text should meet at least 4.5:1; qualifying large text has a 3:1 minimum. Needed control boundaries and visual indicators generally require 3:1 against adjacent colours. [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
Check hover, focus, disabled, selected, error and actual blended surfaces in implementation. A low-contrast decorative divider is not suitable as an essential input boundary.

## Age range and classroom use
Use one coherent identity across school stages. For younger learners, increase legibility, shorten instructions, show a small helpful robot and retain teacher-assisted setup; simply increasing saturation does not address reading ability. For older students, keep the same colour semantics with less character prominence and more concise content. No automatic gender palette or unsupported age-to-colour rule.

Language level, teacher support, task complexity, tap targets and input burden matter as much as hue. The first pilot should test primary, middle and high-school flows separately; children who cannot yet comfortably type need an assisted flow under the current typed-only MVP.

## Full concept inventory
The suite covers the 12 screens in SCREEN_INVENTORY.md, two dark alternatives, a supporting sign-in view and the important uncertainty state.

| Image ID | Screen | Route/state | Theme |
| --- | --- | --- | --- |
| 01-home | Student home | / | Light |
| 02-setup | Learner setup | /setup | Light |
| 03-join | Join a class | /join | Light |
| 04-prepare | Prepare a lesson | /prepare/:id | Light |
| 05-lesson | School lesson detail | /lessons/:id | Light |
| 06-session | Teaching session and supervisor | /sessions/:id | Light |
| 07-results | Student results | /sessions/:id/results | Light |
| 08-classes | Teacher classes | /teacher/classes | Light |
| 09-roster | Class roster and lessons | /teacher/classes/:id | Light |
| 10-materials | Upload and review curriculum | /teacher/classes/:id/materials | Light |
| 11-student-detail | Student evidence detail | /teacher/classes/:id/students/:id | Light |
| 12-settings | Settings and accessibility | /settings | Light |
| 13-home-dark | Home, dark alternative | / · dark variant | Dark alternative |
| 14-session-dark | Session, dark alternative | /sessions/:id · dark variant | Dark alternative |
| 15-sign-in | Sign in | /sign-in · supporting screen | Light |
| 16-uncertainty | Supervisor uncertainty | /sessions/:id · uncertainty state | Light |

Generated designs are illustrative. Sample aliases, teachers, classes and metrics are fictional. No records of actual children were used. Each image is a visual proposal; exact interactions, keyboard behaviour and validation come from the implementation specification.

## State coverage beyond the single screenshot
Each core screenshot represents one state, not every state listed in the original inventory:
- Home: new/returning learner, no class and saved session.
- Setup/sign-in: field error, assisted setup, recovery, retained topic.
- Join: invalid/rotated/already-used code without roster leakage.
- Prepare/materials: extracting, missing context, source failure, draft, partial success and review.
- Lesson detail: published, unavailable, archived or access denied.
- Session: pending evaluation, correct follow-up, supervisor correction, uncertainty, timeout, pause.
- Results: complete, incomplete, no scorable evidence, teacher revision.
- Classes/roster: empty class, unpublished lessons, untested learner.
- Settings: confirmation before deletion, recovery and saved preference.

A separate rendering of every transient/error state would expand the visual set considerably; those behaviours remain specified and required in the implementation pack. The present images cover every distinct screen plus selected high-value states.

## Consistency rules for implementation
Use the same typography, spacing, corner radii, sidebar structure and role components everywhere. Start with 16–18px body text; do not shrink to match a dense generated image. Maintain the original restrained layout, not a generic bright game UI. Preserve the main activity above the fold.

The light/dark selector is a presentation recommendation introduced here; if delivery time is tight, implement the approved preferred mode first and retain the alternate tokens. Do not let dual-theme polish delay supervisor correctness or the school path.

## Quick validation plan
Ask a small set of suitable participants, with school arrangements in place, to:
1. Start a lesson unaided.
2. Identify Errby, themselves and the Supervisor without explanation.
3. Read a correction and explain the next action.
4. Distinguish “Explained” from “Unverified.”
5. Find a class lesson and read their result on their actual device.

Test light and dark versions in counterbalanced order on the same task; log lighting/device, preference, completion errors, reading problems and assistance. Do not use preference alone as proof of comprehension or report population-wide effects from a small pilot. Also inspect grayscale/colour-vision simulation, keyboard focus and 200% text in the built app.

## Research bibliography
1. **[Meta-Analysis of Emotional Designs in Multimedia Learning: A Replication and Extension Study](https://consensus.app/papers/metaanalysis-of-emotional-designs-in-multimedia-learning-wong-adesope/da84bdd704835e7388e0449e3ec860b8/?utm_source=chatgpt)**. R. Wong, Olusola O. Adesope. 2020; Educational Psychology Review. DOI: 10.1007/s10648-020-09545-x. Consensus citation-count snapshot: 130. Record/abstract reviewed; a full-text review is not claimed.

2. **[A systematic review of emotional design research in multimedia learning](https://consensus.app/papers/a-systematic-review-of-emotional-design-research-in-mutlu-bayraktar/f6c2b41652495e77883b33560f7917e2/?utm_source=chatgpt)**. Duygu Mutlu-Bayraktar. 2024; Education and Information Technologies. DOI: 10.1007/s10639-024-12823-8. Consensus citation-count snapshot: 34. Record/abstract reviewed; a full-text review is not claimed.

3. **[Children like it more but don’t learn more: Effects of esthetic visual design in educational games](https://consensus.app/papers/children-like-it-more-but-don’t-learn-more-effects-of-javora-hannemann/82b1ac72b5225c4c939b10092c49cb69/?utm_source=chatgpt)**. Ondrej Javora, Tereza Hannemann, Tereza Stárková, Kristina Volná, C. Brom. 2018; British Journal of Educational Technology. DOI: 10.1111/bjet.12701. Consensus citation-count snapshot: 30. Record/abstract reviewed; a full-text review is not claimed.

4. **[Color design in application interfaces for children](https://consensus.app/papers/color-design-in-application-interfaces-for-children-lyu-xi/2fc409ddca715e9bb5ae3e8dbfbcef74/?utm_source=chatgpt)**. Fei Lyu, Rui Xi, Yujie Liu. 2021; Color Research & Application. DOI: 10.1002/col.22726. Consensus citation-count snapshot: 10. Record/abstract reviewed; a full-text review is not claimed.

5. **[Visual Environment, Attention Allocation, and Learning in Young Children](https://consensus.app/papers/visual-environment-attention-allocation-and-learning-in-fisher-godwin/83e5a9fa869854539e17cefa7405dad4/?utm_source=chatgpt)**. Anna V. Fisher, Karrie E. Godwin, H. Seltman. 2014; Psychological Science. DOI: 10.1177/0956797614533801. Consensus citation-count snapshot: 271. Record/abstract reviewed; a full-text review is not claimed.

6. **[Positive Display Polarity Is Particularly Advantageous for Small Character Sizes](https://consensus.app/papers/positive-display-polarity-is-particularly-advantageous-piepenbrock-mayr/b4efbd56b2725217816ea3c16f782205/?utm_source=chatgpt)**. Cosima Piepenbrock, Susanne Mayr, A. Buchner. 2014; Human Factors: The Journal of Human Factors and Ergonomics Society. DOI: 10.1177/0018720813515509. Consensus citation-count snapshot: 39. Record/abstract reviewed; a full-text review is not claimed.

7. **[The Effect of Display Polarity on Reading Speed and Reading Error Among Young Adults](https://consensus.app/papers/the-effect-of-display-polarity-on-reading-speed-and-reading-muhamad-mokhtar/64f71d92e112569799bfcb055b99c3d4/?utm_source=chatgpt)**. Nurulain Muhamad, N. Mokhtar. 2024; Journal of Health Science and Medical Research. DOI: 10.31584/jhsmr.20241095. Consensus citation-count snapshot: 3. Record/abstract reviewed; a full-text review is not claimed.

8. **[Exploring the interplay of information relevance and colorfulness in multimedia learning](https://consensus.app/papers/exploring-the-interplay-of-information-relevance-and-désiron-schneider/e45c0813b0e754f4ac466d5f699f25e6/?utm_source=chatgpt)**. Juliette C. Désiron, Sascha Schneider. 2024; Frontiers in Psychology. DOI: 10.3389/fpsyg.2024.1393113. Consensus citation-count snapshot: 8. Record/abstract reviewed; a full-text review is not claimed.

Citation counts are a retrieved snapshot, not a measure of study validity. Where publication year and journal issue year differ, the year above follows the fetched record.

## Files in the design handoff
- This research and screen guide.
- palette-tokens.json: exact light/dark design values.
- contrast-audit.json: 22 calculated foreground/background checks.
- SCREEN_BRIEFS.json: individual screen prompt briefs and route mapping.
- IMAGE_GENERATION_STATUS.json: completed/failed inventory after generation.
- UI_PROMPTS.md: shared and screen-specific prompt text for reproducibility.
- RESEARCH_RECORDS.json: bibliographic metadata for the eight fetched paper records.
- SCREEN_INDEX.md: image inventory and implementation review notes.

The images themselves are delivered as generated images in the conversation. They are not live application screenshots.
