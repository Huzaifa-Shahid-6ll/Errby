# T05 — durable preparation and immutable drafts

Implemented 19 September 2026. Local PostgreSQL/service/HTTP checks pass. Hosted Supabase acceptance is **pending credentials**. Nothing here establishes actual Auth JWT, Storage, teacher approval, or model generation success.

## Delivered behavior

In live mode `/prepare` submits the same bounded text/PDF extraction used by T04, then atomically stores a source document, its page chunks and a preparation job. Successful saving opens `/prepare/:id`; `/prepare` lists the latest 50 owner preparations. Private learner sources remain private. Class-scoped creation requires the class's active teacher owner. Both user identity and the server-owned profile are verified before body parsing. Same-origin mutation checks apply.

The initial upload/extraction request is not itself resumable. Its input remains in the open form on failure. Once saved, source text and clarification context survive refresh; the page resumes a pending clarification step, and completed steps are not repeated. Work runs only while the page is open. No queue or unattended background execution is claimed. Partial PDFs retain all readable pages and report missing ones, with a replacement-source path instead of pretending clarification repairs missing text.

Automatic drafting remains disabled until cost reservations/caps are implemented. Learners see an honest saved-source/waiting state. Teachers have an advanced manual schema-1.1 draft import, providing a real end-to-end persistence path without model calls. Import requires version 1, pending review, exactly the saved source, unverified references and exact quoted spans on actual saved pages. Scope-only input cannot become answer evidence. Source hash/provenance is server-bound; fictional source imports remain illustrative. Forged approval/source-check metadata, unrelated source IDs and fabricated quotes fail.

Saving creates a lesson and immutable unreviewed snapshot in one transaction with the job transition. No publish endpoint exists, and no imported review claims are trusted. T14 owns the full edit/review/publish workflow and append-only future versions. Existing published-version protections remain in force. These drafts cannot open learning sessions.

## Contracts and consistency

- `POST /api/preparations`: existing T04 multipart fields; required UUID `Idempotency-Key`; optional UUID `X-Errby-Class-Id`. Returns `{job}` with HTTP 201. Reusing a key for different content, parser result, context or class fails with 409. The UI retains the key across request failure and replaces it when input changes.
- `GET /api/preparations`: latest 50 owner summaries; `GET /api/preparations/:id`: `{job, lesson, can_author}`. Owner/class checks apply to service-role reads; no lease token is returned.
- `POST /api/preparations/:id/step`: `{expected_step:0, context?:{subject,grade,scope}}` clarifies the durable source; `{expected_step:1,draft}` imports a teacher-authored draft. JSON bodies have an actual streamed 500 kB ceiling and 15-second deadline. Invalid input is not saved.
- Step 0 awaits clarification; step 1 awaits a manually supplied draft; step 2 is an immutable snapshot requiring review. `drafting` is a database state and the UI calls it “Waiting for lesson draft.” No model work is implied.
- PostgreSQL functions claim a row under lock, issue a fresh 30-second lease token and compare that token and expiry when finishing. An expired worker cannot finish or mark a newer worker failed. Crashes leave a recoverable lease. The transaction never spans external parsing/provider work.
- Completed-step request hashes distinguish identical retries from changed stale input; identical retries return the same version, while changed retries receive 409. A claim race rereads the completed result. Failure recording is fenced, including after an ambiguous database response.
- Functions use `SECURITY INVOKER`, an empty search path, qualified table names and explicit execute grants to `service_role` only. Authenticated clients retain read-only RLS access and cannot claim jobs, approve content or write progress. The existing 17-table structure is reused.

`20260919000100_durable_preparations.sql` adds source/request/lease/completed-step fields to jobs and the full schema-1.1 JSON snapshot/content hash to lesson versions. The snapshot trigger rejects updates, including forged review changes; deletion remains available to the existing account/data deletion design. Creation serializes briefly per owner to prevent duplicate source records for a repeated key. Source chunks store SHA-256 hashes and page locations.

## Setup and limits

Supply the existing `.env.example` variable names: `ERRBY_MODE=live`, hosted HTTPS `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY`. Apply **all four** repository migrations to a non-local synthetic test project. Provision approved synthetic teacher/learner accounts through the existing operator workflow; use an existing active class for class-scoped API checks. No new variable or dependency is required. Missing configuration/migrations produce actionable unavailable errors; credential-free demo extraction continues without saving.

Only extracted text, source hashes, parser/provenance metadata and page chunks are retained. Original PDF bytes are discarded; private Storage is not used or claimed verified. Database source retention timestamps remain the existing seven-day policy marker; actual deletion scheduling is T17 and is not implemented here. No real pupil material should be used. An interrupted initial upload must be submitted again; a successfully saved source does not require its original PDF to resume clarification or import.

The stored snapshot is one lesson per job; larger curricula need separate preparations. The 50-item list is a bounded first page; known saved links remain directly readable. Paid providers, background queues, DOCX/resource fetching, full teacher editing/publication and learning sessions are outside T05.

## Verification and handoff

`npm run test:preparations` runs two grouped checks. The first executes all migrations in PGlite, then drives actual SQL RPCs through a deliberately small test adapter: durable page records, source hashes, transaction rollback without orphan sources, owner/class restrictions, private learner records, request conflicts, lease exclusion/expiry/fencing, failed-step recovery, exact replay, changed-replay rejection, pending-review snapshots, immutable updates, anonymous denial and authenticated write denial. The second injects identity/database failure responses to test authentication before body use, cross-origin rejection, invalid/oversized JSON, no-store responses and actionable missing-migration errors. The SQL integration also exercises learner import denial through the real application handler. These are **not Supabase HTTP/Auth/JWT tests**.

`tests/browser/preparation-resume.spec.ts` explicitly mocks API responses to test refresh recovery, non-repetition, saved text/context, learner/teacher boundaries in the UI, retained edits after failure, retry-loading recovery and partial-source replacement. Parent verification records final type/lint/build and browser outcomes in `docs/SETUP_STATUS.md`, including actual demo endpoints separately from these UI mocks.

Hosted acceptance still needs real authenticated create/read/step calls, concurrent requests from two clients, expired-lease recovery after a stopped worker, cookie refresh/revocation and two-class/private isolation with actual JWTs. No Docker operation is needed or permitted. Content remains unreviewed. T07 consumes approved immutable versions only after a legitimate publication workflow exists; T14 supplies that workflow.

Current docs consulted: Context7 resolve then query `/vercel/next.js` (async route parameters and route handlers) and `/supabase/supabase` (database functions, invoker security and execute grants), plus installed Next 16.3.5 `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.
