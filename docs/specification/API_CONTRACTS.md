# API and state contracts
All endpoints are proposed. Validate input/output with a shared schema library such as Zod. Authentication, ownership and server-side limits apply even when the UI hides an action.

| Endpoint | Request / result | Important guarantee |
| --- | --- | --- |
| POST /api/classes | title, grade_band → class | Teacher authorised; no client-supplied owner |
| POST /api/classes/:id/code | rotate → join code | Class owner only; store hash |
| POST /api/classes/join | code → membership | Authenticated learner; limited attempts |
| POST /api/materials | multipart source or pasted text → source | MIME/signature/size checks; private ownership |
| POST /api/preparations | source IDs/topic/grade/class → job | All sources accessible to owner |
| POST /api/preparations/:id/step | expected_step → state | Atomic lease; resumable/idempotent |
| PATCH /api/lessons/:id/draft | title/objectives/reference edits | Teacher/owner scope; validated objective IDs |
| POST /api/lessons/:id/publish | reviewed draft version → published version | Blocks unresolved required-reference errors |
| POST /api/sessions | lesson_version → session + genuine opening question | Published/approved context and membership |
| POST /api/sessions/:id/turns | text, expected_sequence, idempotency_key → turn | One accepted submission, ordered evaluation/reply |
| GET /api/sessions/:id | session state | Owner only; teacher uses separate summary path |
| POST /api/sessions/:id/pause | last_sequence → incomplete snapshot | Never converts to complete |
| GET /api/classes/:id/results | lesson/version filters → roster summaries | Class teacher only |
| POST /api/interventions/:id/review | decision + reason | Authorised teacher; append-only revision |
| DELETE /api/account | confirmation → deletion state | Own account or scoped authorised school process |

## Lesson preparation response
Fields: job_id, status, needs_clarification[], source_status[], draft_lessons[], next_step, error.
status enum: pending, extracting, needs_clarification, drafting, needs_review, ready, failed, cancelled.
A resource failure identifies the source and preserves usable other sources; do not call a partial extraction complete.

## Evaluation output
Fields: schema_version, objective_results[], needs_supervisor, intervention, suggested_next_goal.
Each objective result: objective_id, verdict(correct/partial/incorrect/unverified/off_topic), evidence_quote, reference_ids[], misconception_id|null, assisted:boolean, short_reason.
Intervention: type(correction/uncertainty/app_error), user_message, reference_ids[], question_to_student.
Return concise assessment rationale, not hidden chain-of-thought. Validate that evidence occurs in the submitted message and references exist. Unknown IDs or conflicting verdicts fail validation; no score updates.

## Errby output
Fields: role=errby, text, focus_objective_id, misconception_id|null.
Only allow misconception IDs defined in lesson version. First-turn misconception_id must be null. Output cannot write progress or determine completion.
If a supervisor intervention exists, render it and wait for the student's response; do not also append an Errby message that contradicts or obscures the correction.

## Session state
ready → awaiting_student → evaluating → supervisor_pending OR errby_ready → awaiting_student.
Any unfinished state can pause. Verification may set needs_review; goals remain unresolved. Only a server completion check moves to completed. Failed provider requests return retryable state retaining the student's answer. Deletion is terminal.

## Error semantics
400 invalid input; 401 unauthenticated; 403 forbidden; 409 sequence/version conflict; 413 too large; 422 unreadable/unsupported content; 429 quota/rate limit; 502 provider failure.
Return stable error_code and clear user_message without stack traces. Include retry_after only when meaningful. Provider failure after a stored answer must not require retyping.

## Suggested operational limits
One active generation per session. 2,000 learner characters per turn initially; one attached file up to 10 MB and 50 text pages; 30,000 extracted characters per lesson-preparation batch. These are engineering defaults requiring measurement and clear UI labels, not platform guarantees. Split large curricula into units rather than silently truncating.
