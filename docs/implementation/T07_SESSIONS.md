# T07 — learning sessions and the genuine opening question

Implemented 22–23 September 2026. Local SQL/service/HTTP checks pass. Hosted Supabase acceptance is **pending credentials**. Nothing here establishes actual Auth JWT verification, teacher publication, evaluation or grading.

## Delivered behavior

`POST /api/sessions` opens a teaching session for a verified learner against a lesson version that is `published`, is the lesson's `current_published_version`, belongs to an unarchived lesson, and is scoped to the learner (active class membership, or a private lesson the learner owns). The session is created with status `awaiting_student`, and its first message is Errby's opening question taken **verbatim from the published version's `initial_question`** — bound server-side in SQL. No client text, model output or generated premise can become the opening message, which is the T07 acceptance guarantee against a deliberately false first premise.

`GET /api/sessions/:id` returns the owner's session and ordered messages; other learners, the class teacher and anonymous callers receive a neutral unavailable answer. Teachers cannot open learner sessions and cannot read transcripts at any point.

`POST /api/sessions/:id/turns` persists one learner answer per submission: `{text, expected_sequence, idempotency_key}` with a 2,000-character limit. The client-generated UUID idempotency key is used as the turn id: an identical retry returns the stored message, a same-key/different-text retry fails with 409, and a stale `expected_sequence` fails with 409 before any write. After a stored answer the session moves to `evaluating`, which in this build honestly means "saved, awaiting an evaluation that is not implemented yet" — the API and UI say so explicitly. No evaluation, Errby follow-up, supervisor, completion or score exists in T07.

The live `/learn` workspace lists the learner's published lessons (title, objective labels only) through the caller's RLS-scoped session client, with an honest empty state. "Start session" posts to the API and opens `/learn/sessions/:id`, which renders the opening question, saved messages and the composer. Demo mode keeps the T06 fictional fixtures unchanged; the sessions API and session pages fail closed with actionable `live_setup_required` (503, `no-store`), and the demo fixture cards do not invent session persistence.

## Contracts and consistency

- `POST /api/sessions`: JSON `{lesson_version_id}`; identity is verified before the body is read; same-origin mutation checks apply; 201 returns `{session, messages:[opening]}`. Session `visibility`/`class_id` derive from the lesson row under lock, never from the client.
- `GET /api/sessions/:id`: owner-only `{session, messages}`. A session listing route intentionally does not exist yet (T12/T15).
- `POST /api/sessions/:id/turns`: streamed JSON body with a 500 kB ceiling and 15-second deadline; responses are `no-store`. Error codes: `invalid_request`/`invalid_turn` 400, `unauthenticated` 401, neutral 403, `sequence_conflict`/`turn_conflict`/`session_not_awaiting` 409, `too_large` 413, `live_setup_required` and `session_storage_unavailable` 503.
- Client projections carry only lesson title, objective labels, statuses and message text. Objectives, criteria, references and corrections never reach the session client.

`20260922000100_learning_sessions.sql` adds `open_learning_session(p_learner, p_lesson_version_id)` and `record_student_turn(...)` — `SECURITY INVOKER`, empty `search_path`, qualified names, execute granted to `service_role` only. The existing `check_session_scope` trigger re-validates scope on insert, so even service-role inserts of unpublished/cross-class sessions fail. Sessions opened here keep ownership, class and lesson version immutable. The migration also repairs the baseline `visible_versions` RLS policy: published lesson content was readable by **every** authenticated account; it is now restricted to the lesson owner or active members of the lesson's class, and only the current published version.

## Setup and limits

No new environment variables or dependencies. Live sessions additionally require at least one teacher-published lesson version; T14 supplies the publication workflow, so in practice sessions become exercisable end-to-end only after T14 (or by synthetic service-role fixtures in tests). Pause/resume/retry hardening is T12; evaluation is T09; chat rendering for all three roles is T08. `learning_events` analytics rows are not written by T07.

## Verification

`npm run test:sessions` runs two groups. The first loads **all five migrations** in PGlite and drives the real SQL functions through a deliberately small adapter: opening message equals the published `initial_question` verbatim (role `errby`, sequence 0, status `awaiting_student`, class/private visibility), learner-role enforcement, membership/private/cross-class/unpublished/archived denials, client-text rejection, turn persistence with sequence/status transitions, identical replay without duplication, changed-replay and stale-sequence conflicts, wrong-owner neutral denial, length limits, owner-scoped reads, RLS-scoped published-lesson listing per role, tightened cross-class version invisibility, teacher transcript denial, anonymous/authenticated write denial and RPC execute denial, and session immutability. The second group injects identity/database failures: authentication before body use, cross-origin rejection, invalid/oversized JSON, `no-store`, demo fail-closed `live_setup_required`, actionable missing-migration errors and mapped 409/404 conflicts.

`tests/browser/session-flow.spec.ts` checks the real demo API and session page fail closed without mocks, then exercises the session UI with explicit API mocks: genuine opening question, one saved answer with a UUID idempotency key, honest ungraded state, reload persistence, retained input on failure and enabled retry. These are **not Supabase HTTP/Auth/JWT tests**, and mocked UI checks do not verify live persistence.

Hosted acceptance still needs a configured synthetic project: real authenticated open/read/turn calls with actual JWTs, two-class isolation, teacher transcript denial over HTTP, and cookie refresh/revocation around session turns. No Docker operation is needed or permitted. No model call is made anywhere in T07.

## Handoff

T08 renders the full typed chat for the three roles and states; T09 consumes `evaluating` sessions and supplies evaluation/supervisor decisions; T10 generates Errby's next turns against approved misconceptions; T11/T12 own completion and pause/resume; T14 must publish versions through a real teacher workflow before sessions are end-user reachable; T15 owns teacher summaries. No G1–G5 checkpoint is claimed by T07.

Current docs consulted: Context7 resolve then query `/vercel/next.js` (route handlers, server/client components) and `/supabase/supabase` (RPC, invoker security, RLS policies).
