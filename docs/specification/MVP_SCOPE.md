# MVP scope and acceptance
## Must ship
| ID | Capability | Acceptance criterion |
| --- | --- | --- |
| M01 | Home composer | Topic/text input can start preparation; links and uploads expose actual support and failures. Works at 360px and desktop. |
| M02 | Topic clarification | A vague topic asks at most three short questions together; existing grade/context is reused. |
| M03 | Prepared lesson | Versioned objectives, reference content, common misconceptions and initial question exist before session start. |
| M04 | School class | Teacher can create a class, see/rotate code, and manage reviewed lessons. Student cannot become teacher by changing a URL. |
| M05 | School material mapping | Topic list, PDF or notes produce a draft lesson list; teacher can edit and publish selected lessons. Generated content is identified. |
| M06 | Join and access | Authenticated student joins by code, then sees only published lessons for authorised classes. |
| M07 | Teaching conversation | Opens with a genuine question; subsequent misconception is tied to the lesson; learner types explanations. |
| M08 | Supervisor | Incorrect/false-agreement answers or unverifiable points produce a labelled, visually distinct intervention after submission; sources or uncertainty are shown. |
| M09 | Evidence and completion | Every required objective needs a correct, independently expressed explanation/application. Unverified or merely copied correction cannot auto-complete. |
| M10 | Progress recovery | Refresh resumes persisted session; retries do not duplicate messages, scores or model charges where avoidable. |
| M11 | Student result | Concept progress, defined accuracy metric, assisted corrections and active time; pending/uncertain items are visible. |
| M12 | Teacher results | Class roster with lesson-specific status, evidence summaries, active time and unresolved items. Private sessions remain private. |
| M13 | Operations | Cost limits, access checks, prompt/schema versioning and recoverable errors work. |
| M14 | Submission | Reproducible repository, setup README, real commits, disclosure, demo and seeded judge route. |

## Input boundaries
A source is not accepted merely because an upload succeeded. Extraction, scope preparation and review have separate statuses. Text-only fallback is mandatory for resources that cannot be fetched. A YouTube URL is not proof that a transcript was obtained. See SOURCE_INGESTION.md for explicit unsupported cases.

## School scope within two weeks
One teacher manages one or more classes. No district dashboard, procurement workflow, attendance system, marks export integration or timetabling. Lessons can be generated in small batches; do not attempt an entire school year in a single request. A syllabus overview can cover the year while detailed preparation runs for selected units.

## Breadth versus validation
The app accepts diverse school-topic input. The judged demonstration uses a reviewed lesson pack, ideally one science and one maths lesson. Its quality claim is limited to tested behaviour. Inputs needing specialist advice, unavailable evidence or unsuitable content produce a clear boundary rather than invented instruction.

## Scope pressure order
Cut decorative animation, dark/light switching, export formats, optional charts and external-link automation before reducing required school or supervisor functionality. Preserve at least topic/text/PDF, class creation, lesson review, joining, typed learning, evidence-based completion and both role summaries. If delivery still cannot fit, surface the tradeoff to the user instead of marking missing functions complete.
