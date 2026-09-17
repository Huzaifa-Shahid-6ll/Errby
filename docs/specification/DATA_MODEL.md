# Data model and access
Use UUID identifiers, UTC timestamps, server-controlled ownership and schema migrations. The following is a design specification, not executed SQL.

| Entity | Key fields and constraints |
| --- | --- |
| profiles | auth_user_id PK; role learner/teacher; alias; grade_band; setup_mode; created_at. Role changes server-only. |
| classes | id; teacher_id FK; title; grade_band; active; join_code_hash; join_code_rotated_at. Codes never included in analytics. |
| memberships | class_id + student_id unique; alias_in_class; joined_at; status. Membership is scoped, not a school-wide permission. |
| source_documents | id; owner_id; class_id nullable; kind; storage_path nullable; original_url nullable; extraction_status; content_hash; provenance; retention_until. |
| source_chunks | id; source_id; ordinal; text; page/section/timestamp; hash. Client cannot overwrite published references. |
| preparation_jobs | id; owner_id; class_id nullable; status; current_step; lease_until; input_hash; partial_results; error_code. |
| lessons | id; owner_id; class_id nullable; title; current_published_version; archived_at. |
| lesson_versions | id; lesson_id; version unique within lesson; objectives_json; reference_json; provenance; review_status; reviewer_id; reviewed_at. Published versions immutable. |
| sessions | id; learner_id; class_id nullable; lesson_version_id; status; last_sequence; active_ms; opened_at; ended_at; visibility. |
| messages | id; session_id; sequence unique; role student/errby/supervisor; text; turn_id; created_at; source_refs_json. |
| evaluations | id; session_id; message_id; objective_id; verdict; learner_evidence_span; source_refs; assisted; uncertainty_reason; rubric_version; model_id. |
| objective_progress | session_id + objective_id unique; state; evidence_evaluation_ids; revision; updated_at. Derived and server-maintained. |
| interventions | id; session_id; message_id; trigger; correction; resolved; review_status; reviewer_id nullable. |
| learning_events | id; session_id; actor_id; event_name; sequence; server_time; permitted_metadata. Unique event keys prevent duplicates. |
| usage_ledger | id; request_key unique; owner_scope; role; reserved_cost; actual_tokens; actual_cost; provider_status; created_at. |
| assessment_revisions | id; evaluation_id; reviewer_id; old/new verdict; reason; created_at. Append-only. |

## Authorisation matrix
| Record/action | Learner | Class teacher |
| --- | --- | --- |
| Own private session | Read/write via server | No access |
| Own class session | Read/write via server | Summary and scoped evidence through authorised endpoint |
| Another pupil's session | No access | Only in teacher's own class |
| Published class lessons | Read if member | Read |
| Draft/generated class material | No access | Owner read/edit/review |
| Upload personal material | Own only | No automatic access |
| Publish/rotate code/manage class | No access | Class owner only |
| Grade/change goal state | No direct writes | Audited review action only |
| Service-role credentials | Never | Never |

## Identity
Recommended pilot login: teacher email/password or provider-supported sign-in; student alias and generated username/password managed through a trusted backend. An internal synthetic email mapping can bridge student usernames to Supabase Auth without collecting child email. Provision through an authorised teacher flow, confirm only internal addresses server-side, and never send mail to synthetic addresses. Student passwords use provider auth; do not create a home-grown password store.
Teacher resets issue a new temporary credential without revealing the old password. Rate-limit username and class-code attempts. Teacher accounts initially invite/allowlist approved; selecting “teacher” does not grant privileges. Recovery and account deletion must be tested.

## Consistency
The session belongs to exactly one learner and one fixed lesson version. Required objective IDs must exist in that version. Cross-class IDs fail closed. Updating summaries uses one database operation with evaluation revision checks. Deletion removes dependent messages/evaluations/events and object data, while retaining only minimal non-identifying aggregate operational data if justified. Rotating join codes does not eject current members.
