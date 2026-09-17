# Team ownership and 14-day schedule
## Working assumption
Three people, one technical lead, one technical beginner and one nontechnical teammate. The plan assumes the lead can protect roughly 4–6 focused hours/day and teammates roughly 1–3 hours/day. Availability is not confirmed. If substantially lower, use the scope-pressure order in MVP_SCOPE.md immediately.
The user should own the core architecture and review, not personally perform every manual check, content task and presentation step.

## Role division
| Person | Ownership | Concrete outputs | Quality boundary |
| --- | --- | --- | --- |
| Lead (user) | Backend, AI/evaluation flow, access control, integration, deployment | Working end-to-end flow; schema; supervised conversation; completion rules | Approves all auth, schema, provider and integration changes |
| Beginner teammate | Bounded UI and QA automation | Lesson cards, supervisor component, results cards, roster display, responsive fixes, smoke tests | Works from supplied props/fixtures; does not invent API/security logic |
| Third teammate | Content, school contact, manual QA and presentation | Reviewed lesson examples, expected-answer sheet, pilot notes, reproducible bug reports, demo script/video and README drafts | Factual answers checked by teacher/lead; no invented trials or claims |

The third role is substantial. Give them named deliverables and acceptance criteria, not only “marketing” or moral support. Each person must understand and explain their own work.

## Collaboration routine
15-minute daily check: what now works, biggest blocker, next concrete output. One task per person at a time. Short branches, small meaningful commits, same-day review and integration. No unreviewed AI-generated bulk merges.
Lead freezes component props and data contracts before handing UI work over. Beginner submits screenshot plus tested interaction. Third teammate reports steps, expected/actual behaviour, device and redacted evidence.
Use one shared board: Ready, In progress, Review, Done. A task is Done only after acceptance evidence is recorded. Production keys stay with lead.

## Daily plan
| Day | Lead | Beginner | Third teammate | Exit gate |
| --- | --- | --- | --- | --- |
| 1 | Scaffold, schema/auth spike, one vertical-slice contract | Learn repo; reproduce home shell | Contact teacher; draft 2 lesson outlines; contribution log | Synthetic end-to-end design agreed |
| 2 | Prove model evaluation and source parsing | Composer and lesson card fixtures | Write correct/partial/wrong answers with reviewer | Text/PDF → valid draft; provider and transcript limits known |
| 3 | Versioned lessons + genuine opening question | Typed session and loading/error states | Test wording with adult/teacher | One source → one question → persisted answer |
| 4 | Evaluator + supervisor + state transition | Supervisor and objective list | False-agreement and uncertainty cases | Incorrect agreement triggers correction |
| 5 | Evidence tracking, completion and retry idempotency | Result cards | Check metrics against manual examples | No false completion; reload resumes |
| 6 | Teacher class, code, membership/RLS | Class creation/join UI | Prepare minimal syllabus and notes fixture | Teacher can create; learner can join |
| 7 | Upload → clarify → map → review/publish | Review lesson list UI | Review generated lesson content | School path runs end to end |
| 8 | Roster summaries and scoped queries | Teacher dashboard | Full scripted QA, access checks with lead | Teacher can inspect class evidence |
| 9 | Source edge cases, DOCX/link fallback, caps | Mobile/Chromebook layout | Try unsupported/empty inputs | Errors recover without losing work |
| 10 | Fix critical defects | Keyboard/accessibility and tests | Teacher walkthrough or supervised eligible trial | Recorded observations; no fabricated data |
| 11 | Model/evaluation regression, performance | Responsive fixes | Draft demo narrative and screenshots | Core tasks pass; feature freeze |
| 12 | Permissions/cost/retention check | Clean setup verification | Record first demo take | Candidate release and README |
| 13 | Fix blockers; deploy candidate | Run clean-browser smoke test | Final video, attribution and submission draft | Complete submission package ready |
| 14 | Buffer and final verification | Device checks | Proofread links and submit with lead | Submit before personal cutoff |

Do not postpone the school path until after decorative work. Day 7 is a key feasibility checkpoint. If it fails, simplify batch size and teacher editing UI rather than removing the required flow.

## Quality rules
One shared definition of done: flow works with real state; failure recoverable; no secret exposure; keyboard/mobile pass; source/evidence logic checked; clear commit and reviewer. Content QA is as important as rendering.
Record each person's genuine learning and contributions. Assign official submission to the lead and proofreading to teammate three. No account sharing required.
