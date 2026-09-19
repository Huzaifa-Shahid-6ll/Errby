# Implementation index

The original backlog remains in [IMPLEMENTATION_TASKS.md](../specification/IMPLEMENTATION_TASKS.md). Current implementation and verification status is maintained in [SETUP_STATUS.md](../SETUP_STATUS.md); the original specification pack is preserved.

| Task                    | Implementation notes                                            | Next dependency                                                       |
| ----------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| T01 foundation          | Setup status and repository README                              | Hosted CI verification                                                |
| T02 identity/access     | Setup status and hosted identity checklist in repository README | Hosted Auth verification; T13 class workflows                         |
| T03 lesson contracts    | [Lesson pack and human review handoff](T03_LESSONS.md)          | Human review; T09 evaluator                                           |
| T04 extraction          | [Text/PDF extraction and recovery](T04_INGESTION.md)            | Hosted upload verification; T16 other adapters                        |
| T05 durable preparation | [Preparation jobs and immutable versions](T05_PREPARATION.md)   | Hosted persistence verification; T07 sessions; T14 review/publication |
| T06 learning home       | [Composer, navigation and fixture lesson list](T06_HOME.md)     | T08 session rendering after T07                                       |

Local SQL/provider-mock checks do not establish live Supabase Auth or Storage acceptance. Fictional lesson fixtures and saved unreviewed drafts do not establish content approval, grading or lesson completion.
