# Implementation index

The original backlog remains in [IMPLEMENTATION_TASKS.md](../specification/IMPLEMENTATION_TASKS.md). Current implementation and verification status is maintained in [SETUP_STATUS.md](../SETUP_STATUS.md); the original specification pack is preserved.

| Task                    | Implementation notes                                            | Next dependency                                                                 |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| T01 foundation          | Setup status and repository README                              | Hosted CI verification                                                          |
| T02 identity/access     | Setup status and hosted identity checklist in repository README | Hosted Auth verification; T13 class workflows                                   |
| T13 classes/membership  | [T13_CLASSES.md](T13_CLASSES.md)                                | Hosted synthetic Auth/RLS verification                                          |
| T03 lesson contracts    | [Lesson pack and human review handoff](T03_LESSONS.md)          | Human review; T09 evaluator                                                     |
| T04 extraction          | [Text/PDF extraction and recovery](T04_INGESTION.md)            | Hosted upload verification; T16 other adapters                                  |
| T05 durable preparation | [Preparation jobs and immutable versions](T05_PREPARATION.md)   | Hosted persistence verification; T07 sessions; T14 review/publication           |
| T06 learning home       | [Composer, navigation and fixture lesson list](T06_HOME.md)     | T08 session rendering after T07                                                 |
| T07 learning sessions   | [Session open and genuine first question](T07_SESSIONS.md)      | Hosted persistence verification; T08 rendering; T09 evaluation; T14 publication |
| T08 typed chat          | [Three-role chat and session states](T08_CHAT.md)               | T09 evaluator/Supervisor decisions; T10 replies; T11 completion; T12 recovery   |
| T09 evaluator contract  | [Decision gate and candidate corpus](T09_EVALUATION.md)         | Teacher review; real model run and atomic integration remain pending            |
| T10 next-turn selection | [Authored reply selection](T10_NEXT_TURN.md)                    | Persisted reply orchestration and live evaluator remain pending                 |
| T11 objective evidence  | [Evidence and completion transaction](T11_EVIDENCE.md)          | Live evaluator integration and hosted verification remain pending               |
| T12 session recovery    | [Pause, retry and reload](T12_RECOVERY.md)                      | Live evaluator integration and hosted verification remain pending               |
| T18 responsive QA       | [Accessibility and responsive QA](T18_QA.md)                    | Tablet browser run, device and screen-reader verification                       |
| T19 walkthrough         | [Teacher/adult protocol and outcome log](T19_WALKTHROUGH.md)    | Actual eligible participants and reviewed findings                              |
| T20 release             | [Candidate setup and demo plan](T20_RELEASE.md)                 | Clean setup, hosted gates, recording and authorised deployment                  |

Local SQL/provider-mock checks do not establish live Supabase Auth or Storage acceptance. Fictional lesson fixtures and saved unreviewed drafts do not establish content approval, grading or lesson completion.
