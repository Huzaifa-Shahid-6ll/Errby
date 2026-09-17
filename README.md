# Errby

A responsive learning app where students explain topics to an intentionally mistaken AI, with a separate Supervisor checking misconceptions. **This repository currently contains the local development foundation, not the complete product.**

## Run on Windows

Use Node.js **24.18.0** and npm **11.16.0** (the versions verified during setup). Git is recommended. Docker and external credentials are optional for the UI preview. Use npm only; `package-lock.json` fixes compatible dependency versions.

```powershell
Set-Location 'G:\ONGOING PROJECTS\Errby'
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Stop with Ctrl+C. If that port is occupied, run `npm run dev -- --port 3001`. The dev server binds to this computer only.

The home composer, example lesson, light/dark preview and responsive navigation work without services. Text stays in React memory in the current tab and disappears on reload. The sample is fictional and explicitly unreviewed. Its opening question and Supervisor notice are static fixtures, not model output. No account, class membership, grade, upload, persistence or paid API call is simulated as successful.

## Environment

Copy `.env.example` to `.env.local`; never commit the latter. All variables below are server-side. None use `NEXT_PUBLIC_`.

| Variable                   | Meaning                                                                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ERRBY_MODE`               | `demo` (default) runs without credentials. `live` validates Supabase configuration and shows a truthful integration-pending page; it does not enable unfinished flows. |
| `SUPABASE_URL`             | Local or hosted Supabase endpoint. Required only in live mode.                                                                                                         |
| `SUPABASE_PUBLISHABLE_KEY` | Project publishable key (or local anon key). The server session client uses the authenticated user's RLS permissions.                                                  |
| `SUPABASE_SECRET_KEY`      | Reserved privileged server credential. No admin client is exposed or used yet.                                                                                         |
| `OPENAI_API_KEY`           | Reserved for the future server provider adapter; unused in this foundation.                                                                                            |
| `OPENAI_MODEL`             | Candidate `gpt-4.1-mini`. Must pass the reviewed evaluator suite before adoption.                                                                                      |

Environment validation runs at startup/build and reports field names without printing values. No credentials are needed for build, tests or demo. `live` never silently falls back to fictional data. Adding keys does not make the product complete or authorise paid calls.

## Local database

Supabase Postgres, Auth and private Storage are the documented target. Install/start Docker Desktop with the Linux engine for the full local stack. The pinned Supabase CLI is a dev dependency; no global install is needed.

```powershell
Set-Location 'G:\ONGOING PROJECTS\Errby'
docker info
npm run db:start
npm run db:migrate
npm run db:status
```

`db:start` downloads the local service images on first run and applies migrations. `db:migrate` applies any later unapplied migrations locally. Copy local endpoint/key values into `.env.local` yourself; do not paste keys into chat or source control. Supabase Studio uses the URL printed by the CLI. Stop the stack with `npm run db:stop`.

For a disposable Errby local database only, `npm run db:reset` recreates it and reapplies migrations; **this deletes its local records**. No remote database commands or paid resources are part of setup.

The baseline includes all 16 documented entities, indexes, ownership foreign keys, immutable published lesson content, fixed session ownership/version, sequence/turn uniqueness and RLS. Anonymous access and direct authenticated writes are denied. Read policies cover a learner's own records and authorised published lessons. Teachers cannot directly read learner sessions; scoped summary endpoints remain to be implemented. Class code hashes are excluded from client column grants. The private `source-documents` bucket allows up to 10 MB; object access has no client policies yet and stays closed.

There are no seeded accounts/passwords. `supabase/seed.sql` is deliberately empty; UI fixtures come from the supplied example JSON. The database test creates isolated synthetic records in memory and destroys them on completion.

**Verified here:** SQL migrations, constraints and selected RLS scenarios against embedded Postgres/PGlite. Auth/storage schemas in that harness are stubs. **Not verified here:** the actual Supabase services, signed URLs or real authenticated JWTs. Docker's engine was stopped during setup; real-role integration tests remain required before live flows.

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

| Location                                   | Responsibility                                                                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app`                                  | Next.js App Router routes, root layout and health endpoint.                                                                                                      |
| `src/components`                           | Presentational shell and minimal shadcn/Radix button.                                                                                                            |
| `src/lib/env`                              | Validated server configuration; no secrets exported to UI.                                                                                                       |
| `src/lib/auth`, `src/lib/db`               | Verified Auth lookup and cookie-aware Supabase session client for Route Handlers/Server Actions. No demo impersonation or service-role bypass.                   |
| `src/lib/ingestion`                        | Server-only pasted-text validation; file/URL adapters remain unimplemented.                                                                                      |
| `src/lib/ai`                               | Server-only boundary for preparation, evaluation/Supervisor and Errby. Requests deliberately fail closed until grounding, validation and cost reservation exist. |
| `src/lib/lessons`                          | Explicitly unreviewed fictional fixture.                                                                                                                         |
| `supabase/migrations`                      | Postgres schema/RLS and private bucket baseline.                                                                                                                 |
| `tests`                                    | Deterministic configuration/token checks, SQL harness and browser smoke tests.                                                                                   |
| `docs/specification`, `docs/visual-design` | Unmodified copies of the supplied documentation, tokens and screen briefs.                                                                                       |

Use Route Handlers/server functions for ownership checks, ingestion, durable preparation steps and model calls. Uploaded text and model output are untrusted. The browser must never set roles, correctness, completion, costs or reference provenance. Published lesson versions stay fixed for a session. Next.js `server-only` imports enforce these module boundaries at build time.

The product backlog retains topic/pasted text, text-PDF (10 MB, 50 pages), planned DOCX, and honest webpage/YouTube transcript fallback. No file format or link extraction is supported by the current preview. Do not add unsafe fetching or advertise a parser merely because the storage bucket accepts its MIME type.

## Design and next work

The 17 September colour-and-screen guide supersedes the older dark-first palette. Both exact token sets are installed; light is the default. Styling uses Tailwind 4, system fonts, a slim labelled rail, solid reading surfaces and a restrained home halo. Errby uses indigo; the Supervisor has an amber shield and explicit label. Progress uses teal only when earned. No image binaries were supplied; screen briefs and the visual index were inspected, not actual mockups.

Next: implement the first genuine teaching slice: authorised identity and private text/PDF source → reviewed, immutable lesson → genuine opening question → persisted learner answer. Then add validated evaluation, separate Supervisor feedback and evidence-controlled completion. Keep the required school upload/review/join path in the next increments; the setup preview is not a substitute for it.

See [setup evidence and remaining work](docs/SETUP_STATUS.md), [architecture](docs/specification/ARCHITECTURE.md), [scope](docs/specification/MVP_SCOPE.md) and [test requirements](docs/specification/TESTING.md). Real pupil use remains gated by the supplied privacy/provider requirements; this foundation uses synthetic material only.

## Attribution and AI assistance

This foundation was created with OpenAI Codex assistance from the user's supplied Errby specifications. AI assisted code, migrations, tests and setup documentation; the team must review and understand them. No pupil trial, model benchmark, efficacy claim, public deployment or completed product is claimed. The Button follows the [MIT-licensed shadcn/ui Radix pattern](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md); icons are from Lucide. Original requirements and research provenance remain in `docs/`.

Official setup references consulted via Context7: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint), [Supabase server clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase local development](https://supabase.com/docs/guides/local-development), [shadcn Next.js](https://ui.shadcn.com/docs/installation/next), [PGlite API](https://pglite.dev/docs/api), [Playwright web server](https://playwright.dev/docs/test-webserver).
