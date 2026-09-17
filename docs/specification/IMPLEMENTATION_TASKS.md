# Ordered implementation tasks
This is an executable backlog specification, not completed work. Owners: L lead, B beginner, C content/QA teammate.

| ID | Priority / owner | Depends on | Task and acceptance |
| --- | --- | --- | --- |
| T01 | P0 / L | — | Create repository, env template, CI type/build check and schema baseline; fresh checkout starts without secrets. |
| T02 | P0 / L | T01 | Teacher/student identity and RLS; two synthetic classes cannot read each other. |
| T03 | P0 / L+C | T01 | Write lesson schema and reviewed example pack; each objective has source/correction criteria. |
| T04 | P0 / L | T03 | Text/PDF extraction and sparse-topic clarification; failures preserve input. |
| T05 | P0 / L | T02,T04 | Store preparation jobs and immutable lesson versions; refresh can resume a pending step. |
| T06 | P0 / B | T01,T03 | Home composer, sidebar and lesson list with fixtures; 360px and keyboard work. |
| T07 | P0 / L | T05 | Session create and genuine opening question; no deliberately false first premise. |
| T08 | P0 / B | T06,T07 | Typed chat rendering for three roles and states; supervisor distinct without colour dependence. |
| T09 | P0 / L+C | T03,T07 | Evaluator/supervisor contract and test set; false agreement, wrong claim and uncertainty classified correctly. |
| T10 | P0 / L | T09 | Approved misconception selection, source validation and Errby next-turn generation; unresolved corrections cannot be reinforced. |
| T11 | P0 / L | T10 | Objective evidence and server completion; no client-set scores, no copied-answer automatic pass. |
| T12 | P0 / L+B | T08,T11 | Persist/retry/pause/reload; duplicate requests produce one turn and one metric update. |
| T13 | P0 / L | T02,T05 | Class creation/code rotation/membership; invalid codes, reuse and unauthorised role changes handled. |
| T14 | P0 / L+B | T05,T13 | Teacher material→draft map→edit/review→publish; at least one complete real school path. |
| T15 | P0 / L+B | T11,T13 | Results and teacher summaries; metrics match fixture and private sessions excluded. |
| T16 | P0 / L | T04 | DOCX adapter and honest resource-link handling; transcript unavailable fallback works. |
| T17 | P0 / L | T09,T15 | App budget reservations, provider failure recovery, limits, deletion and redacted logs. |
| T18 | P0 / B+C | T12,T14,T15 | Responsive, accessibility and scripted flow QA; lead fixes logic/security findings. |
| T19 | P0 / C+L | T18 | Teacher walkthrough and eligible pilot; record limitations, reviewed changes, genuine feedback. |
| T20 | P0 / L+C | T17,T18 | Candidate deployment, clean setup, demo recording, AI disclosure and contribution evidence. |
| T21 | P1 / B | T18 | Restrained transitions/light theme if time remains; reduced motion preserved. |
| T22 | P1 / L | T16,T20 | Improve automatic external-source extraction only if reliable and permitted. |

## Checkpoint gates
G1 (day 3): one prepared topic and a persisted learner answer.
G2 (day 5): supervisor + objective evidence + save/resume.
G3 (day 7): real class/code/upload/review/lesson route.
G4 (day 10): two-role analytics and school walkthrough readiness.
G5 (day 13): judged demo release, no open blocking defects.

## Blocking defects
False completion, treating unverified claims as correct, leaking another learner/class, missing school upload path, lost submitted answers, duplicate grading, inability to demonstrate live session, exposed secret or broken setup.
Visual polish is secondary to these gates.

## Coding-agent instructions
Work in dependency order. Keep proposed defaults distinguishable from user decisions. Do not silently remove requested capabilities to pass build. For each task record files changed, test evidence, limitations and next dependency. Do not mark tasks complete based on generated screenshots or mocked responses.
