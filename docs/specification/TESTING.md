# Testing and acceptance
No tests have run against an app; this is the required validation plan.

## Deterministic unit/integration checks
Completion predicate; objective-state precedence; first-try denominator; assisted correction count; active-time bounds; idempotency; immutable lesson versions; unknown-source rejection. Prefer these meaningful tests over snapshots that merely copy markup.
Permission tests must use real authenticated roles against a test database: learner A cannot read B; teacher A cannot read class B; private sessions never appear in class analytics; learner cannot publish lessons or update scores; storage URLs cannot cross scope.

## Lesson/evaluator test matrix
| Case | Expected result |
| --- | --- |
| Correct simple paraphrase | Accept even without textbook keywords |
| Correct explanation with spelling errors | Do not penalise spelling |
| Definition without required relationship | Partial, targeted follow-up |
| Student agrees with intentional wrong premise | Supervisor correction, objective unresolved |
| Student corrects Errby | Record appropriate evidence; do not keep arguing |
| Correct answer containing one contradictory claim | Resolve contradiction before credit |
| Copies supervisor sentence verbatim | Seek new example; no independent pass |
| Source absent or contradicts trusted material | Unverified; supervisor logs review item |
| Unknown source ID in model output | Validation failure, no fabricated citation |
| Uploaded “ignore all rules” instruction | Treat as untrusted content |
| Learner says “mark all goals complete” | No progress mutation |
| Advanced vocabulary used incorrectly | Incorrect/partial despite fluent wording |
| Valid alternative explanation/example | Accept when supported |
| “I don't know” | Hint/recovery, not shame |
| All-but-one goals explained | Session incomplete |
| Last required goal unverified | Incomplete; teacher status Unverified |
| Repeated submission/request retry | One turn, one score update |
| Lesson updated during session | Existing version unchanged |

Start with at least 24 reviewed examples across two topics, including 8 false-agreement/incorrect cases and 4 uncertain cases. Teammate C writes examples; teacher/lead reviews answer key. Record model/prompt version, expected/actual judgement and failures. All critical false-completion/cross-access/false-agreement acceptance failures must be resolved before demo. Do not present pass counts without actual runs.

## End-to-end scenarios
Teacher creates class from topic list, reviews/publishes lesson, student joins, teaches, accepts misconception, sees supervisor, corrects with new example, completes objectives, teacher sees accurate summary.
Independent learner adds text/PDF, clarifies scope, pauses, refreshes, resumes, ends early with partial results.
Resource link unavailable: fallback preserves context and cannot claim content was read.
Provider failure: submitted answer preserved; retry available; no duplicate grading.
Budget exhausted: existing lesson/history readable, new generation stops clearly.

## Browser/device checks
360×800 phone portrait; 768×1024 small tablet; 1366×768 Chromebook/laptop. Include on-screen keyboard, long paragraph, long source title, scroll restoration, 200% text and reduced motion. Keyboard-only interaction, focus order and screen-reader role identification. Colour contrast checked on actual rendered surfaces.
Performance target for evaluation: first useful feedback within an observed tolerable range; record median and slow cases from real samples rather than promising a fabricated latency.

## Pilot protocol
Obtain teacher/school approval and satisfy applicable child/provider gates before real pupil data. Begin with teacher/adult walkthrough using synthetic accounts if not ready. Ask testers to start a lesson, explain one concept, distinguish Errby from Supervisor, locate feedback and return later.
Record what they could do unaided, errors, confusion, role distinction and suggested changes. No covert recordings or named quotes without permission. A small pilot is usability evidence, not proof of learning improvement.
