# Errby

Errby is a learning app where the learner teaches an AI character, explains mistakes and builds evidence of understanding. A separate Supervisor highlights corrections and uncertainty. The repository includes source preparation, class publication, saved learning sessions, AI evaluation and replies, evidence-based progress, teacher results and operational budget controls.

**Current acceptance is local.** Hosted Auth/database verification, observed paid model results, human lesson approval and a real walkthrough remain pending. The supplied direct database connection is unreachable from this IPv4 environment; a reachable hosted session-pooler connection is needed before migration verification. See [setup status](docs/SETUP_STATUS.md) for the latest evidence and [release guide](docs/implementation/T20_RELEASE.md) for the hackathon checklist. No deployment, recording or submission is claimed.

## Start the local preview

Use Windows PowerShell, Node **24.18.0**, npm **11.16.0** and the existing lockfile. Do not use local Docker Desktop or its engine.

```powershell
Set-Location 'G:\ONGOING PROJECTS\Errby'
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
$env:ERRBY_MODE = 'demo'
npm run dev
```

Open [http://127.0.0.1:3000/learn](http://127.0.0.1:3000/learn). Stop with Ctrl+C. If port 3000 is occupied, use `npm run dev -- --port 3001`.

Demo needs no credentials and makes no model calls. The example conversation is fictional and unreviewed. `/prepare` performs real pasted-text and sample-document extraction, but demo does not create accounts or save learning to a hosted database. Do not present the preview as live grading.

## Enable the real synthetic flow

Follow the [hosted setup steps](docs/implementation/T20_RELEASE.md#hosted-synthetic-setup) in order: configure the dedicated project, apply migrations, provision an approved teacher, create a class, provision synthetic learners, then enable the budget. Setting environment keys alone does not complete these steps.

Copy secrets privately into ignored `.env.local`; never paste them into command arguments, recordings, source files or `NEXT_PUBLIC_` variables. All configuration below is server-only.

| Variable                        | Purpose                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `ERRBY_MODE`                    | `demo` for preview; `live` for genuine authenticated persistence and configured AI. |
| `SUPABASE_URL`                  | Dedicated non-local HTTPS `*.supabase.co` synthetic test project.                   |
| `SUPABASE_PUBLISHABLE_KEY`      | Session client, subject to the signed-in user's row policies.                       |
| `SUPABASE_SECRET_KEY`           | Privileged server operations with application authorization checks.                 |
| `OPENROUTER_API_KEY`            | Server provider key. Calls also require an enabled database budget.                 |
| `OPENROUTER_MODEL`              | `gpt-4.1-mini` or `openai/gpt-4.1-mini`; other models are rejected.                 |
| `ERRBY_APPROVED_TEACHER_EMAILS` | Operator allowlist for already provider-confirmed teacher accounts.                 |
| `ERRBY_OPERATOR_CONFIRM`        | `synthetic-test-project` opt-in for account and operations commands.                |

After updating `.env.local`, remove any demo override with `Remove-Item Env:ERRBY_MODE -ErrorAction SilentlyContinue` and restart the app. Live mode does not fall back to fixtures when a service fails.

The AI adapter reserves a conservative maximum before calling OpenRouter, permits one dispatch per request, enforces provider price ceilings and caches completed responses for safe replay. The operator tool permits at most **$1 total**, with **$0.03 per request**; new reservations stop at 90% of the total cap. Unknown provider outcomes remain charged against reserved capacity until an operator reconciles them. [Budget, retention and deletion commands](docs/implementation/T17_OPERATIONS.md).

## Hackathon journey

1. Teacher signs in at `/setup`, creates a class at `/classes`, then prepares factual synthetic source text or a document at `/prepare`.
2. AI creates a draft. Teacher checks its objectives, references and corrections before publishing the class lesson. Generation never supplies human approval.
3. A synthetic learner signs in, opens the published lesson from `/learn`, explains a concept and receives validated Errby/Supervisor feedback. Saved answers drive persisted objective evidence; uncertainty never completes an objective.
4. Pause, return to `/learn` and reopen saved learning. Inspect the learner recap and the teacher's class results, including review of flagged assessments.
5. Private learner preparation is labelled AI-generated and not teacher-reviewed, and remains outside the teacher's class results.

These paths are implemented; hosted acceptance must demonstrate them before a live presentation. Use adult roleplay and fictional data. Real pupil use remains gated by school and provider privacy requirements.

## Import into Vercel

Import the Git repository with the root directory set to `.`. The root `vercel.json` selects Next.js, `npm ci` and `npm run build`; leave the output directory at its framework default. `package.json` selects Node 24.x and allows npm 11.x, while `.node-version` retains the tested local patch. See [Vercel's Node version rules](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

For a fictional demo deployment, set `ERRBY_MODE=demo` in Vercel's environment settings; no credentials are required. Demo is also the default when the variable is absent. `.vercelignore` excludes local secrets, generated presentation assets and build/test artifacts from CLI uploads. Keep `docs/specification/EXAMPLE_LESSON.json`: the demo imports it at build time.

For live mode, add `ERRBY_MODE=live`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` privately in the intended Vercel environment, then redeploy. Complete the [hosted synthetic setup](docs/implementation/T20_RELEASE.md#hosted-synthetic-setup) first. Migration/operator credentials do not belong in the deployed app. Builds never apply database migrations or enable model spending.

Vercel Functions have a [4.5 MB request-body limit](https://vercel.com/docs/functions/limitations#request-body-size), below this app's local 10 MiB document allowance. Use smaller documents or pasted text for the hosted demo; larger uploads require a separate direct-to-storage upload flow. Hosted Auth, storage, worker execution and AI acceptance still need verification after deployment.

## Verify locally

```powershell
npm run check
npm run build
npx playwright install chromium
npm run test:browser
```

`check` runs lint, route types/TypeScript, deterministic and PGlite tests, then formatting. Browser tests start their own demo server on port 3100. `npm run db:test` is the focused Docker-free SQL check. To run the production build locally, use `npm run start` after a successful build.

Local SQL tests stub Auth and Storage. Mock provider and browser checks establish application behavior, not actual provider billing, hosted Auth/JWTs, Storage, school approval or screen-reader acceptance. Logs, screenshots and traces belong in ignored `test-results/`; inspect them before sharing. No hosted command runs as part of `npm test`.

## Repository map

| Location                                       | Responsibility                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/app`                                      | Pages and server routes for account, preparation, classes, learning and results.                                                |
| `src/lib/auth`, `src/lib/db`                   | Identity, scoped provisioning and database clients.                                                                             |
| `src/lib/ingestion`, `src/lib/preparations`    | Bounded text/PDF/DOCX extraction, source provenance and durable preparation. Links require pasted text; videos are not watched. |
| `src/lib/ai`                                   | Budgeted provider adapter, source-grounded drafts, evaluation and checked replies.                                              |
| `src/lib/sessions`, `src/lib/results`          | Saved teaching flow, evidence, completion and scoped summaries/revisions.                                                       |
| `supabase/migrations`                          | Schema, row policies and atomic server transactions. Apply in filename order.                                                   |
| `scripts/accounts.ts`, `scripts/operations.ts` | Explicit operator provisioning, budgets, retention and confirmed class deletion.                                                |
| `tests`                                        | Local SQL, contract, integration and browser checks.                                                                            |
| `docs/specification`, `docs/visual-design`     | Supplied requirements and authoritative design references.                                                                      |
| `docs/implementation`                          | Implementation evidence and remaining acceptance.                                                                               |

## AI assistance and attribution

OpenAI Codex substantially assisted implementation, migrations, tests, documentation and visual concepts from the supplied specifications. The team must review, understand and accurately attribute that work. UI fixtures are fictional; generated lesson drafts require the displayed review process. No learning-gain, school-participation or model-quality claim is implied by passing engineering tests.

Third-party packages and pinned versions are listed in [package.json](package.json) and [package-lock.json](package-lock.json). The Button follows the [MIT-licensed shadcn/ui Radix pattern](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md); the project uses Lucide and Phosphor icons. See [T20](docs/implementation/T20_RELEASE.md) for the honest recording script and contribution record.
