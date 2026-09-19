# Errby

A responsive learning app where students explain topics to an intentionally mistaken AI, with a separate Supervisor checking misconceptions. **This repository contains T01 foundation, locally implemented T02 identity/access, T03 lesson contracts/examples and T04 text/PDF extraction. Human lesson approval, hosted Supabase verification and the remaining product workflows are pending.**

See [setup status](docs/SETUP_STATUS.md) for current verification evidence and limitations, including the distinction between local checks and hosted acceptance. Local Docker Desktop must not be used.

## Run on Windows

Use Node.js **24.18.0** and npm **11.16.0** (the versions verified during setup). Git is recommended. The UI preview needs no external credentials. Do not use, start, stop or inspect local Docker Desktop or its engine. Use npm only; `package-lock.json` fixes compatible dependency versions.

```powershell
Set-Location 'G:\ONGOING PROJECTS\Errby'
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Stop with Ctrl+C. If that port is occupied, run `npm run dev -- --port 3001`. The dev server binds to this computer only.

The home composer, example lesson, light/dark preview and responsive navigation work without services. Text stays in React memory in the current tab and disappears on reload. The sample is fictional and explicitly unreviewed. Its opening question and Supervisor notice are static fixtures, not model output. The separate `/prepare` page runs real pasted-text extraction and a fixed synthetic PDF sample without credentials; arbitrary PDF uploads require live sign-in. No account, class membership, grade, persistence or paid API call is simulated as successful.

## Environment

Copy `.env.example` to `.env.local`; never commit the latter. All variables below are server-side. None use `NEXT_PUBLIC_`.

| Variable                   | Meaning                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ERRBY_MODE`               | `demo` (default) runs without credentials with text/sample-PDF extraction. `live` enables configured sign-in and authenticated PDF extraction; lesson generation and sessions remain unavailable. |
| `SUPABASE_URL`             | Non-local synthetic Supabase test project endpoint. Required only in live mode.                                                                                                                   |
| `SUPABASE_PUBLISHABLE_KEY` | Project publishable key. The server session client uses the authenticated user's RLS permissions.                                                                                                 |
| `SUPABASE_SECRET_KEY`      | Required in live mode for the durable sign-in throttle and operator account provisioning. Server only; never sent to the browser.                                                                 |
| `OPENAI_API_KEY`           | Reserved for the future server provider adapter; unused in this foundation.                                                                                                                       |
| `OPENAI_MODEL`             | Candidate `gpt-4.1-mini`. Must pass the reviewed evaluator suite before adoption.                                                                                                                 |

Environment validation runs at startup/build and reports field names without printing values. No credentials are needed for build, tests or demo. `live` never silently falls back to fictional data. Adding keys does not make the product complete or authorise paid calls.

## Local database

Supabase Postgres, Auth and private Storage are the documented target. Local SQL validation uses the existing in-memory PGlite harness, without Docker or external services.

```powershell
Set-Location 'G:\ONGOING PROJECTS\Errby'
npm run db:test
```

`db:test` applies migrations to an isolated temporary database and checks constraints and selected access policies. It also runs within `npm test` and CI. Docker-backed `db:start`, `db:stop`, `db:status`, `db:migrate` and `db:reset` scripts have been removed. Real Supabase verification requires a configured non-local synthetic test project; do not provision services or run remote migrations as part of local setup.

The baseline includes all 16 documented entities, plus a server-only sign-in throttle table, indexes, ownership foreign keys, immutable published lesson content, fixed session ownership/version, sequence/turn uniqueness and RLS. Anonymous access and direct authenticated writes are denied. Read policies cover a learner's own records and authorised published lessons. Teachers cannot directly read learner sessions; scoped summary endpoints remain to be implemented. Class code hashes are excluded from client column grants. The private `source-documents` bucket allows up to 10 MB; object access has no client policies yet and stays closed.

There are no seeded accounts/passwords. `supabase/seed.sql` is deliberately empty; UI fixtures come from the supplied example JSON. The database test creates isolated synthetic records in memory and destroys them on completion.

**Verified here:** SQL migrations, constraints and selected RLS scenarios against embedded Postgres/PGlite. Auth/storage schemas in that harness are stubs. **Not verified here:** the actual Supabase services, signed URLs or real authenticated JWTs. PGlite does not verify live Auth or Storage; real-role integration tests remain required before live flows.

## Verification

```powershell
npm run check          # ESLint, route types/TypeScript, tests, formatting
npm run build          # production compilation
npx playwright install chromium
npm run test:browser   # starts its own server on 127.0.0.1:3100
```

`npm run format` formats maintained files. Supplied source documents and SQL are excluded from formatting to preserve their contents. `npm run lint` and `npm run typecheck` can run independently. To preview a production build, run `npm run start` after `npm run build`.

Browser checks cover 360×800 and 1366×768, first-page rendering, keyboard skip navigation, the fictional example, text preservation, theme changes, horizontal overflow and runtime errors. Screenshots/traces go to ignored `test-results/`. These checks do not certify the complete product or screen-reader accessibility. CI repeats checks, build and browser smoke tests when this repository is eventually pushed; no push was made during setup.

## Structure and boundaries

| Location                                   | Responsibility                                                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app`                                  | Next.js App Router routes, root layout and health endpoint.                                                                                                                                |
| `src/components`                           | Presentational shell and minimal shadcn/Radix button.                                                                                                                                      |
| `src/lib/env`                              | Validated server configuration; no secrets exported to UI.                                                                                                                                 |
| `src/lib/auth`, `src/lib/db`               | Verified Auth/profile lookup, scoped operator provisioning and session/admin clients. App reads use user RLS; the privileged client is limited to the throttle and explicit operator tool. |
| `src/lib/ingestion`                        | Bounded server-only text/PDF extraction, provenance, coverage and sparse-topic clarification. DOCX/URL adapters remain unimplemented.                                                      |
| `src/lib/ai`                               | Server-only boundary for preparation, evaluation/Supervisor and Errby. Requests deliberately fail closed until grounding, validation and cost reservation exist.                           |
| `src/lib/lessons`                          | Validated lesson/source contracts, review gates and source-checked examples awaiting human approval; original fictional UI fixture preserved.                                              |
| `supabase/migrations`                      | Postgres schema/RLS and private bucket baseline.                                                                                                                                           |
| `tests`                                    | Deterministic configuration/token checks, SQL harness and browser smoke tests.                                                                                                             |
| `docs/specification`, `docs/visual-design` | Unmodified copies of the supplied documentation, tokens and screen briefs.                                                                                                                 |

Use Route Handlers/server functions for ownership checks, ingestion, durable preparation steps and model calls. Uploaded text and model output are untrusted. The browser must never set roles, correctness, completion, costs or reference provenance. Published lesson versions stay fixed for a session. Next.js `server-only` imports enforce these module boundaries at build time.

The preparation page supports topic/pasted text and text-PDF extraction with displayed byte, page and character limits. It reports missing text pages and preserves input on request failure. Extraction is not factual approval, a generated lesson or a saved preparation job. DOCX, webpage and YouTube transcript imports remain T16; no external links are fetched.

## Design and next work

The 17 September colour-and-screen guide supersedes the older dark-first palette. Both exact token sets are installed; light is the default. Styling uses Tailwind 4, system fonts, a slim labelled rail, solid reading surfaces and a restrained home halo. Errby uses indigo; the Supervisor has an amber shield and explicit label. Progress uses teal only when earned. Screen references are available in `docs/Screens_images`; visual concepts do not establish product functionality.

Next: T05 durable preparation jobs and immutable lesson storage, then the genuine opening question and persisted learner answer. Hosted identity/upload acceptance and human lesson-pack review remain pending alongside that work. Then add validated evaluation, separate Supervisor feedback and evidence-controlled completion. Keep the required school upload/review/join path in the next increments; extraction alone does not complete that path.

See [setup evidence and remaining work](docs/SETUP_STATUS.md), [architecture](docs/specification/ARCHITECTURE.md), [scope](docs/specification/MVP_SCOPE.md) and [test requirements](docs/specification/TESTING.md). Real pupil use remains gated by the supplied privacy/provider requirements; this foundation uses synthetic material only.

## Attribution and AI assistance

This foundation was created with OpenAI Codex assistance from the user's supplied Errby specifications. AI assisted code, migrations, tests and setup documentation; the team must review and understand them. No pupil trial, model benchmark, efficacy claim, public deployment or completed product is claimed. The Button follows the [MIT-licensed shadcn/ui Radix pattern](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md); icons are from Lucide. Original requirements and research provenance remain in `docs/`.

Official setup references consulted via Context7: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint), [Supabase server clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase local development](https://supabase.com/docs/guides/local-development), [shadcn Next.js](https://ui.shadcn.com/docs/installation/next), [PGlite API](https://pglite.dev/docs/api), [Playwright web server](https://playwright.dev/docs/test-webserver).

## T03 lessons and T04 preparation

Open `/prepare` from the home page. In demo mode, use synthetic pasted text or the built-in sample PDF; arbitrary file uploads require a verified account in live mode. Extraction runs on the server and reports real text, location markers and coverage. Answer the missing subject, grade and scope questions together, then resubmit. Input stays in the current page on failure; refresh recovery and durable jobs belong to T05.

The lesson contracts require objective-specific explanations, facts, references, misconceptions, correction criteria and changed-example prompts. The science/maths example pack records its factual sources and technical checks, but still needs human review. Its expected-answer cases are a review aid, not an executed AI benchmark. The original home example stays fictional and unreviewed. See [T03 contracts and content review](docs/implementation/T03_LESSONS.md) and [T04 extraction and recovery](docs/implementation/T04_INGESTION.md) for file maps, limits, research references and targeted checks.

No new credentials are required for these local checks. Adding the existing Supabase configuration enables live verification when a synthetic test project and approved accounts are ready; it does not approve the lesson pack or enable paid model calls. School publication, persistent source storage, lesson generation, sessions and grading remain subsequent tasks.

## T02 identity setup (hosted verification pending)

`/setup` implements provider-backed password sign-in/out in live mode. The server verifies Auth and reads the caller's protected profile; UI role choices, class codes and `user_metadata` never grant roles. Profile roles cannot be changed in place. Unknown/unapproved Auth accounts fail closed. Live home shows the verified alias/role and a link to preparation. Demo still requires no credentials and offers no fake sign-in; its preview composer remains unchanged.

Before enabling live mode, apply every migration in filename order to a **dedicated hosted synthetic test project**, configure its HTTPS `*.supabase.co` URL and the Supabase URL and two keys in `.env.local`, and disable public signups in the provider. Keep provider email confirmation enabled and configure Supabase Auth password strength, token expiry, rate limits and any pilot abuse controls. The app adds a durable limit of five attempts per normalized identifier and 100 total attempts per fixed 15-minute window; provider controls remain necessary because the Auth API is independently reachable. The global ceiling is deliberately small for the synthetic pilot and can temporarily stop all logins. No client IP headers are trusted. Throttle records contain only identifier hashes and counters; expired windows are removed on the next attempt.

Initial provisioning is an **operator-only CLI**, not a teacher dashboard. `ERRBY_APPROVED_TEACHER_EMAILS` is a comma-separated allowlist in the ignored local environment. Approve only an existing Auth user whose teacher email ownership has already been confirmed through the provider. This tool does not create or automatically confirm real teacher email accounts. Provider invitation/teacher password recovery configuration and actual mail delivery remain hosted setup responsibilities.

Set `ERRBY_OPERATOR_CONFIRM=synthetic-test-project` in the local environment only when intentionally running the command. Use IDs from the dedicated hosted project. The example identifiers below are placeholders, not working accounts:

```powershell
@{ operation='approve-teacher'; userId='<confirmed-auth-user-uuid>'; alias='Synthetic teacher A' } | ConvertTo-Json -Compress | npm run account:manage
@{ operation='create-learner'; teacherId='<approved-teacher-uuid>'; classId='<owned-active-class-uuid>'; alias='Synthetic learner A' } | ConvertTo-Json -Compress | npm run account:manage
@{ operation='reset-learner'; teacherId='<approved-teacher-uuid>'; classId='<owned-active-class-uuid>'; userId='<learner-uuid>' } | ConvertTo-Json -Compress | npm run account:manage
```

Learner creation requires an existing active class owned by an approved teacher. Class creation/join/teacher self-service screens remain T13; use deliberately synthetic fixtures in the hosted SQL editor for T02 verification. The CLI generates an unguessable `learner-…` username and provider-managed password, creates only an internal `@students.errby.invalid` address, and never sends email there. It writes the learner profile and class membership; failure removes the incomplete Auth account, or reports its ID for operator cleanup if deletion itself fails. No password is stored in app tables. Generated credentials are deliberately printed once for secure teacher delivery: do not paste them into chat, source control, logs or shared terminal recordings. Recovery generates a replacement only for an active learner in that teacher's active class; it cannot reset teachers or unrelated students. It never reveals the old password. Provider token revocation/expiry after password changes is **not yet verified**; do not promise immediate invalidation of existing sessions.

Local checks: `npm run test:identity` exercises identifier validation, teacher approval, class/recovery rejection and provisioning cleanup; `npm run db:test` tests migrations/RLS with stubbed Auth. Neither calls Supabase or verifies live credentials. No hosted command runs during `npm test` or CI.

Hosted acceptance still required: use two approved teachers and two synthetic learners in separate classes; sign in through `/setup`, reload through token refresh, sign out, and confirm cross-class/profile/source/session denial using actual Auth-issued tokens. Include private sessions, removed membership, inactive class, direct role/score writes, public-signup/user-metadata spoofing, failed provisioning cleanup, replacement password and old-session behavior, and account deletion/cascade cleanup. Teacher class summaries, account deletion UI and retention jobs are later tasks. Clean up test identities/records afterwards through the trusted provider; no real pupil data is permitted. T02 is implemented locally but **not marked hosted-accepted**.

## T05 durable preparation and T06 learning workspace

This section supersedes the earlier descriptions of T05 as future work. Open `/learn` for the learning workspace, or `/prepare` directly. The demo offers two fictional, unreviewed lessons, labelled empty/returning/preparation examples, keyboard navigation and a topic composer. Composer text passes to preparation in tab memory; it is not placed in a URL or browser storage and is lost on refresh before a live save.

In live mode, preparation saves extracted text, page locations, coverage, provenance and context in owner-scoped PostgreSQL records. Opening a saved preparation link resumes its current step after refresh. Requests use retry keys and bounded, expiring database leases to prevent duplicate work and stale writes. Original PDF bytes are not retained in Storage. Closing the page does not promise background processing.

Automatic lesson generation remains disabled: no model request or cost reservation is fabricated. Teachers can import a schema-validated, unreviewed draft bound to the saved source. Saved lesson snapshots are immutable; importing a draft does not approve or publish it. Learners can save and clarify their sources but cannot grant review approval. Full teacher editing/publication belongs to T14, session opening to T07 and grading/completion to T09–T11.

For hosted verification, supply `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and server-only `SUPABASE_SECRET_KEY` in ignored `.env.local`, set `ERRBY_MODE=live`, apply **all** migrations in filename order, including `20260919000100_durable_preparations.sql`, and provision synthetic accounts as described above. No additional provider key is needed for T05/T06. Use a dedicated hosted test project; local Docker is prohibited. Missing configuration or migrations must be corrected before claiming a successful live save.

See [T05 implementation and hosted checklist](docs/implementation/T05_PREPARATION.md), [T06 interface and browser checks](docs/implementation/T06_HOME.md), and the [implementation index](docs/implementation/README.md). Local PGlite, injected-identity and provider-mock results do not verify real Auth-issued tokens, hosted persistence, cookie refresh or Storage. Human content review and hosted acceptance remain pending.
