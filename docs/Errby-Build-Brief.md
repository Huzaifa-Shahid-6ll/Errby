# Errby — build brief
16 September 2026 · Documentation and concept designs; no app has been implemented.

## Product
An English responsive web app for primary-through-high-school learners. Students bring a topic/resource or select a reviewed school lesson, then teach Errby by typing. Errby begins with an open question and later asks mistaken follow-ups. A visibly separate supervisor intervenes after a wrong or unverifiable submitted explanation.

The teacher creates a class, supplies even a minimal topic list, reviews generated lesson drafts, publishes and shares a class code. Completion requires correct learner evidence for every required objective. Student results show defined accuracy, time and correction measures; teacher results show topic-specific one-word statuses with supporting detail.

## Three-person division
| Person | Owns | Deliverable |
| --- | --- | --- |
| You | Architecture, backend, AI evaluation, access control, integration and deployment | The reliable end-to-end product |
| Beginner teammate | Bounded UI components, responsive fixes and tests | Composer/chat/supervisor/result/roster interfaces using agreed contracts |
| Third teammate | School coordination, reviewed content examples, manual QA, demo and README drafts | Real evidence of usability, a reproducible bug list and clear presentation |

The third role is substantive; each teammate must be able to explain their work. Review changes daily and keep meaningful commits. Do not divide sensitive backend/AI ownership between inexperienced parallel implementers.

## Fourteen-day checkpoints
- Days 1–3: source preparation and one genuine teaching turn.
- Days 4–5: supervisor, learner evidence, completion and save/resume.
- Days 6–7: complete school class/upload/review/join flow.
- Days 8–10: both-role analytics, mobile behaviour and teacher walkthrough.
- Days 11–12: feature freeze, regressions, setup and first demo recording.
- Day 13: submission-ready release.
- Day 14: buffer only.

The official deadline is 1 October 2026, 2:00 am Pakistan time; plan to submit on 29 September. [FirstCommit rules](https://firstcommit.devpost.com/rules). Schedule assumes roughly 4–6 focused hours/day for the lead; actual availability is unknown.

## Visual direction
Use the supplied Lovable layout: slim rail, central composer, rounded graphite surfaces and a diffuse blue/lilac halo. Errby uses a lavender identity; supervisor uses amber, a role label and shield icon. Images shown in the chat are proposed visual concepts, not implemented UI. Light mode and decorative animation are lower priority than the main working flow.

## Stack and cost recommendation
Next.js/TypeScript + Supabase + one hosted application; candidate model behind a replaceable provider adapter. Free hosting/database plans may be sufficient for the constrained demo; eligibility and quotas apply. Reserve approximately $10–20 for measured API use, not a promised total or permission to spend. Details and official pricing links are in COST_AND_OPERATIONS.md.

## Important engineering decisions
- Supervisor checks against prepared references; uncertainty is a recorded state, not a confident correction.
- All objectives explained controls completion. A turn/time limit does not grant a pass.
- Separate first-try accuracy from correct-after-help. Show denominators; time is not a grade.
- A status such as Explained or Developing belongs to a lesson, not a child's overall ability.
- Make text/PDF reliable; declare exactly when a link/transcript needs pasted text.
- Prepare school lesson drafts from sparse input and ask only necessary clarification.
- Retain class isolation, cost caps, privacy controls and honest source provenance.

## School-pilot limitation
Provider settings and the school's process must be ready before real younger-pupil data is used. OpenAI's under-18 guidance requires zero data retention before processing under-13 personal data. Use a teacher/adult demonstration with synthetic users until those conditions are satisfied. [Official guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance).

## Handoff
The ZIP contains the complete specifications, dependency-ordered tasks, test cases, source references and an illustrative lesson JSON. Start with README.md. Architecture/model choices are recommended defaults; the user's product requirements remain authoritative. Remaining items are operational checks in OPEN_ITEMS.md, not another discovery interview.
