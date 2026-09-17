# Historical discovery record

Earlier proposals below are historical, not the final specification. DECISIONS.md and the focused documents supersede them. Latest confirmed direction: minimal-cost 14-day web-only build, three-person team, English, school uploads and teacher review, open-question-first typed teaching, distinct supervisor after wrong answers, all-objective evidence completion, student/teacher analytics, and Lovable-inspired minimal halo design.

# Errby — product discovery

Status: discovery in progress. Updated 2026-09-16.

## Confirmed direction

- The user selected the WrongBot concept: a learner teaches a deliberately mistaken robot by identifying and correcting its misconceptions.
- Current work is conversation, requirements gathering, naming, and project documentation.
- Do not implement or deploy the app during this discovery phase.
- The approved product name is **Errby**. WrongBot is the original concept label.
- The immediate ambition is winning the FirstCommit hackathon. A continuing business is not yet a confirmed goal.
- Intended learners span primary and middle school, with high school students envisaged as more serious users. Exact ages, grades, and the first demo cohort are unresolved.
- The intended setting is schools. The user expects each child to have access to a phone, laptop, or Chromebook; actual school device availability has not been verified. Teacher involvement is unresolved.
- The user has a school in mind for potential testing. No school contact, agreement, access, or pilot has been confirmed.
- Learners should be able to teach any topic they are studying. Subject breadth is a product requirement; supported launch content and evaluation coverage still need definition.
- Schools should be able to upload curriculum/syllabus material, which Errby maps into selectable lessons.
- Students or teachers can set up a session with a topic explanation, YouTube link, or other resource. Errby prepares specifically for that topic before the teaching conversation begins.
- The website has a sidebar, with the primary home area dedicated to entering material and starting a lesson. The user's Airbnb analogy is about exposing the main activity immediately, not copying Airbnb's visual design.
- MVP teaching interaction is typed conversation. Voice, drawing and draggable visual teaching controls are not approved MVP requirements.
- The confirmed conversation order is: Errby asks an open-ended question without a deliberate mistake; the student explains; Errby asks follow-up questions containing plausible mistakes for the student to correct. This supersedes opening immediately with an incorrect explanation.
- School curriculum upload and lesson selection must work in the hackathon MVP.
- The intended learning approach is teaching in simple words, described by the user as the Richard Feynman method. The learning goal is for the learner to explain what they have learned in their own simple, accurate words. A score, dashboard, certificate, or specific end-of-session artifact has not been approved.
- English is the only required language for the first version.
- Assume minimal cooperation and material provision from schools. Do not require a complete curriculum pack or polished teacher content to start. Exact accepted formats and handling of sparse source material remain to be specified.
- The user approves the teacher flow: create a class, upload material, review generated lessons, and share a class code with students. The class code connects students to a class; authentication and account ownership are separate unresolved decisions.
- A distinct supervisor agent should intervene and correct the misconception when the student accepts Errby's incorrect explanation. The user calls this a third agent; whether this means a third AI role or the supervisor as the third participant alongside student and Errby is not yet established. Its user-facing function is confirmed; implementation topology is not.
- Discovery should now use one consolidated questionnaire because the user is in a hurry. Offer clearly labelled defaults for explicit batch acceptance instead of repeated small question rounds.

## Approved name; proposed tagline

**Errby** (suggested pronunciation “ER-bee”). A short character name inspired by “error.” The name is approved; using it for both the app and robot remains a proposal. Suggested explanatory line: “Teach a little bot. Learn a lot.” The tagline is not approved.

A preliminary web search on 2026-09-16 did not surface an obvious learning app using the exact spelling Errby. This does not establish domain, handle, or trademark availability. The name also occurs in unrelated personal-name results.

Names screened out: Tovi already names a learning app (https://tovi.app/); Oopi already names software products (https://oooopi.com/); Dunno already names a learning-related product (https://dunno.ai/).

## Proposed concept — details require discussion

A robot presents a plausible misconception. The learner identifies the faulty reasoning, demonstrates a correction, and checks the robot on a different problem. Its notebook records the corrected rule. The intended emotional experience is helping a curious character improve, with room for the learner to make mistakes too.

Earlier suggestions of fractions only, five misconceptions, draggable fraction pieces, and authored logic are not confirmed requirements. The current user direction is broad topic support, session preparation from provided context, and typed teaching. The exact AI architecture remains undecided.

## Discovery sequence

1. Identity and purpose: name, hackathon versus continuing product, intended age group, first user and usage setting.
2. Learning experience: subjects, curriculum, languages, learner prerequisites, teaching interaction, how understanding is checked, hints and recovery.
3. Character and design: robot personality, emotional tone, visual references, motion, accessibility, device priorities.
4. Scope and feasibility: minimum complete learning session, features to defer, available time, team, experience, budget, target platform, operating costs.
5. Technical decisions: authored content versus model-generated dialogue, correctness checks, model choices if needed, storage, identity, connectivity, and evaluation.
6. Children and adults: account ownership, parental/teacher involvement, data minimisation, retention, safety boundaries, content handling, and age-appropriate flows.
7. Delivery: acceptance criteria, meaningful learning evidence, testing, demo, implementation sequence, and launch criteria.

## Current questions

Use the consolidated decision questionnaire below. Known answers must not be requested again.

## Consolidated decision questionnaire — defaults are NOT approved

The user can accept all proposed defaults and override numbered items. Until accepted, retain them as proposals.

| # | Decision | Proposed default or information needed |
| --- | --- | --- |
| 1 | Build resources | User to provide team size, who will implement, daily time, and target date for a usable build. |
| 2 | Budget and providers | User to provide total remaining hackathon budget and any existing model/API access; never request secret keys in chat. |
| 3 | Platform and stack | Responsive browser app for phone/laptop/Chromebook; no native app for MVP. Record any preferred or required stack/hosting, otherwise select during architecture work. |
| 4 | Demonstration and trial | Broad topic support remains required. Pick one middle-school science lesson for a rehearsed demo; user to identify accessible grade/topic and whether a school trial is feasible before submission. |
| 5 | Input formats | Typed/pasted text, text-based PDF, DOCX, accessible public webpages, and YouTube transcripts. Show extracted content for review. For scanned pages, absent transcripts, blocked links, or unsupported media, preserve input and request pasted text; no full video visual analysis or OCR by default. |
| 6 | Minimal school input | Accept a topic list or syllabus outline. Generate editable draft lesson structure and content; clearly distinguish source-derived material from generated material. Teacher reviews before students can access school lessons. Sparse/ambiguous content asks for scope clarification. |
| 7 | Teacher setup | One teacher can create a class, set grade, add materials, edit lesson titles/objectives/content/order, publish reviewed lessons, and rotate a join code. No institution-wide administration portal for MVP. |
| 8 | Student access | Individual topic sessions and school classes both supported. Teachers have accounts; school students use pseudonymous accounts with resumable progress, class codes attach class membership. Younger learners use teacher/guardian-assisted setup. Exact login method and independent younger-user access need explicit resolution. |
| 9 | Supervisor intervention | A separately labelled supervisor message gives a short, supportive correction when the learner endorses a misconception, then asks for a restatement. Errby's next response incorporates the correction. Agent count is an architectural decision, not a fixed requirement of three model calls. |
| 10 | Uncertain correctness | Use prepared reference material to check claims. If correctness cannot be established, pause that claim, explain uncertainty, and seek another source/teacher review instead of confidently grading. Do not treat model agreement as independent proof. |
| 11 | Session length and finish | A short session around 3-5 learning goals, with an end-session control; finish with a teach-back and one application question. No claim of measured duration until tested. |
| 12 | Student result | A concise recap of clear explanations, corrected misconceptions, remaining gaps, and one next step. Use descriptive feedback, not public ranks or unvalidated numerical mastery scores. |
| 13 | Teacher result | Class lesson participation/completion and per-student concept summaries. Private independent sessions are not shared with teachers; raw transcripts are not shared by default. Teacher visibility must be explained to students. |
| 14 | Saving and data | Save lesson preparation, session position, transcript and recap for authenticated learners with clear deletion controls. Retention duration, consent/account rules, and school data isolation must be decided in privacy/architecture documentation. |
| 15 | Appearance | Minimal, expressive robot, restrained animation, plain readable English. Language/difficulty adapt to grade; no punitive streaks or leaderboard in MVP. User may supply references and colour/theme preferences. |
| 16 | Documentation handoff | Markdown documentation pack: product requirements, approved decisions, scope, flows/screens, learning and supervisor behaviour, source ingestion, design, architecture/data, privacy, tests, implementation tasks and hackathon demo/submission checklist. No app implementation during this stage. |

Resource access, supported subjects, age handling and safety need evidence-based validation during specification work. These defaults do not establish accuracy guarantees, school consent, or tested platform capabilities.

## Confirmed teaching sequence and proposed completion

1. **Confirmed:** Prepare a session from the student's topic/resource or a school lesson.
2. **Confirmed:** Errby asks an open-ended question without deliberately incorrect premises.
3. **Confirmed:** The student types an explanation.
4. **Confirmed:** Errby asks a follow-up with a plausible misunderstanding that the student can identify and correct. The follow-up should relate to the explanation and lesson.
5. **Proposed:** Continue a bounded explanation-and-correction exchange, with hints when the learner is stuck and an explicit, accurate resolution of introduced misconceptions.
6. **Proposed:** Invite a final short teach-back in the learner's own words, optionally using a new example. Give specific feedback on correctness, clarity, and remaining gaps rather than treating fluency or short words as proof of understanding.

The app simulates a confused learner; it should not claim that the underlying model is retrained by each conversation. Whether the robot retains corrected lesson state across sessions remains undecided. The exact turn count, finish condition, rubric, source-checking architecture, and teacher-visible outcomes remain open.

Example for discussion: Errby asks why ice melts in a warm room; the student explains heat transfer; Errby follows up, “So does the ice make its own heat to melt?” The student corrects the source of heat. This is an illustrative authored example, not an approved subject restriction.

## Learning entry routes — user requirements

| Route | Input | Intended result | Unresolved detail |
| --- | --- | --- | --- |
| Student or teacher prepares a topic | Topic explanation, YouTube link, or another resource | A session prepared for the specific topic | Supported resource types, age/level input, source extraction and validation |
| School prepares curriculum | School syllabus, curriculum, or teaching material | Material mapped into lessons students can select | Uploader role, file formats, lesson review, classroom assignment and MVP depth |

## Home and preparation flow — proposed specification

The primary home control asks what the student wants to teach Errby, with topic entry and resource attachment/link options. School-connected students also see relevant selectable lessons. Keep sidebar navigation visually secondary. The exact sidebar items, final copy, and layout are not yet approved.

Proposed sequence: provide topic/source or choose a school lesson; extract usable material; propose topic, level and learning goals; allow necessary corrections; start typed teaching. Reuse known grade/class context rather than asking every time. A confirmation step should remain brief and earn its place by correcting ambiguous scope.

Preparation must distinguish a curriculum outline from explanatory teaching content: an outline can define lesson structure without supplying enough information to judge a learner's explanation. Source access, factual validation, uncertainty handling, and any teacher-review requirements need specification before implementation. An unsupported or inaccessible URL should not silently become an invented source-based lesson; preserve input and offer a supported alternative.

UX hypotheses, not measured results: one prominent lesson-start area may help learners identify their first action; grouping resource options may reduce unnecessary comparison; honest preparation status may help them understand waits. Status should reflect actual processing, with no fabricated percentages or delays. Validate these through a school walkthrough when access is confirmed.

## Scope considerations — proposals, not decisions

- Preserve the primary-through-high-school vision while selecting one coherent demonstration cohort and topic for the hackathon.
- A browser-based experience is a proposed fit for the expected phone, laptop, and Chromebook access. Platform and technology choices are not approved yet.
- Use age-appropriate language and character behaviour; the older-student experience should retain the teaching mechanic while supporting more demanding content. Do not assume this requires separate apps or feature tiers.
- Treat school access as a validation opportunity to discuss, not as a confirmed user base or evidence of learning impact.

## Classroom concept for discussion — not approved

One short session: a topic is prepared from provided context or a school lesson; Errby asks a genuine open-ended question; the learner types an explanation; Errby introduces a mistaken follow-up; the learner corrects it. This order and typed interaction are confirmed. A final teach-back or fresh application question is proposed to inspect the learner's understanding; the robot's scripted improvement alone does not demonstrate learning. Final assessment, exact ages and teacher reporting remain open. School upload and lesson selection are confirmed MVP requirements.

## Documentation to develop from agreed answers

| Document | Purpose |
| --- | --- |
| PRODUCT_BRIEF.md | User, problem, promise, success criteria, non-goals |
| DECISIONS.md | Confirmed choices, rationale, unresolved questions |
| MVP_SCOPE.md | Required experience, acceptance criteria, deferred work |
| LEARNING_DESIGN.md | Misconceptions, correction logic, transfer questions, content validation |
| USER_FLOWS.md | Complete learner journeys and recovery paths |
| SCREEN_INVENTORY.md | Screen states and interactions |
| DESIGN_SYSTEM.md | Approved brand, type, colour, components, character and motion |
| ARCHITECTURE.md | Stack and system boundaries justified by requirements |
| DATA_MODEL.md | Minimum data, ownership, lifecycle and access |
| PRIVACY_AND_SAFETY.md | Child-appropriate safeguards and data decisions |
| TESTING.md | Functional, learning-content, accessibility and reliability checks |
| ROADMAP.md | Ordered implementation milestones and dependencies |
| HACKATHON_SUBMISSION.md | FirstCommit rules, demo, attribution, AI disclosure and evidence of work |

Do not fill unresolved decisions with assumed facts. Keep this document as the discovery record until enough requirements are agreed to produce the detailed documentation set.

## Decision log

| Date | Decision | Source |
| --- | --- | --- |
| 2026-09-16 | Explore the WrongBot concept | User: “I want to build wrong bot” |
| 2026-09-16 | Discuss and document before implementation | User clarification |
| 2026-09-16 | Begin with minimal, cool naming | User clarification |
| 2026-09-16 | Approve Errby as the name | User: “Errby is good” |
| 2026-09-16 | Prioritise winning the hackathon | User stated ambition |
| 2026-09-16 | Target young children in schools | User stated audience and setting; exact age unresolved |
| 2026-09-16 | Broaden audience to primary and middle school, plus high school for more serious study | User clarification; supersedes young-children-only framing |
| 2026-09-16 | Expect individual access to a phone, laptop, or Chromebook | User expectation, not verified school inventory |
| 2026-09-16 | Identify a possible school for testing | User has a school in mind; participation unconfirmed |
| 2026-09-16 | Support student topics and school curriculum mapped into lessons | User describes both entry routes; exact MVP depth unresolved |
| 2026-09-16 | Prepare sessions from a topic explanation, YouTube link, or other resource | User requirement; technical source support not yet specified |
| 2026-09-16 | Put lesson input/start in the main home area with a sidebar | User UX direction |
| 2026-09-16 | Use typed teaching in the MVP | User explicitly confirms typing |
| 2026-09-16 | Start with a correct open-ended question, followed by student explanation and mistaken follow-up questions | User's final proposed sequence supersedes immediately opening with a mistake |
| 2026-09-16 | Include functional school uploads and selectable lessons in the hackathon MVP | User explicitly says yes |
| 2026-09-16 | Aim for simple explanations in the learner's own words | User invokes the Richard Feynman method; exact assessment not yet decided |
| 2026-09-16 | Support English only for the initial version | User confirmation |
| 2026-09-16 | Assume minimal school-supplied materials and effort | User constraint |
| 2026-09-16 | Teacher creates a class, uploads/reviews lessons, and shares a class code | User accepts proposed workflow |
| 2026-09-16 | Supervisor corrects the learner when they accept Errby's mistake | User explicitly requests a supervisor agent |
| 2026-09-16 | Ask remaining discovery questions together | User is in a hurry |
