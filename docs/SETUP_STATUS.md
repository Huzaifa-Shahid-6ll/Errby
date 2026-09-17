# Setup status — 17 September 2026

## Outcome

Runnable local foundation created in `G:\ONGOING PROJECTS\Errby`. No application or Git repository existed at that path before setup. A standalone `main` repository is initialised; nothing is staged, committed, pushed or deployed. No paid resources or provider requests were made.

The sibling documentation/design folders were already extracted. No ZIP extraction was necessary. All supplied files were copied into `docs/specification` and `docs/visual-design`; source and copy hashes match. The build brief and newer colour guide are also preserved. No supplied image binaries exist: the screen index explicitly says images were delivered in a previous conversation. All available screen briefs, role/revision notes and tokens were inspected; actual mockup images could not be visually reviewed.

The historical no-build instruction belongs to discovery and is superseded by the current setup request. Scope remains foundation only; the complete MVP backlog is unchanged.

## Decisions

| Decision                                                          | Basis                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One Next.js App Router application, TypeScript, npm               | Documented stack; one developer and two bounded contributor roles do not need a monorepo or separate services.                                                                                                                                                                      |
| Next 16.3.5, React 19.3.0, TypeScript 6.0.3, Tailwind 4.3.3       | Stable registry releases installed and verified together. Exact versions and transitive dependencies are in the npm lockfile.                                                                                                                                                       |
| Node 24.18.0, npm 11.16.0                                         | Installed Windows toolchain; pinned in `.node-version`, engines and packageManager.                                                                                                                                                                                                 |
| ESLint 9.39.5, Next config 16.3.5                                 | Latest ESLint 10 conflicts with the current Next import/react/accessibility plugin peer ranges. The compatible 9 release passes without lint warnings. npm emits an upstream deprecation notice; upgrade once the plugins support 10. No force/legacy-peer-deps workaround is used. |
| Tailwind + minimal shadcn/Radix Button, Lucide, system font       | Documented accessible component system, without extra fonts/network requests or unused component scaffolding.                                                                                                                                                                       |
| Supabase 2.117.0 CLI, supabase-js 2.116.0, SSR 0.12.7             | Postgres/Auth/private Storage remain the deployment architecture. No ORM or alternate runtime database.                                                                                                                                                                             |
| Light default; matching dark preview                              | New 17 September guide overrides the old dark-first palette. Exact role tokens retained and tested. Theme preference is tab-local for this preview.                                                                                                                                 |
| Explicit `demo` default; live mode fails closed                   | Works with no secrets; live mode does not quietly display demo records. No key triggers model spending.                                                                                                                                                                             |
| PGlite for isolated SQL tests                                     | Docker Desktop is installed but its Linux engine is stopped. This validates PostgreSQL DDL/RLS without provisioning cloud services; it is not the app database or a real Supabase integration test.                                                                                 |
| Vercel deployment target, no deployment now                       | Documented one-owner target. Hosting eligibility, accounts, quotas and production configuration remain external setup.                                                                                                                                                              |
| No vector store, queue service, agent framework or analytics SaaS | Documented bounded lessons, database jobs and ordinary server functions cover the intended first slice.                                                                                                                                                                             |

## Completed

- npm project and lockfile, strict TypeScript, Next lint rules, formatting, route type generation and build scripts.
- Environment template/validation, server-only module protection, Git ignores for secrets, uploads, backups and generated output.
- Responsive home shell, topic preservation within the tab, a fictional lesson preview, labelled Errby and Supervisor, accessible controls/skip link, reduced-motion support and both token sets.
- Read-only health route reporting mode and disconnected integration status.
- Server-side Supabase session client and verified Auth helper. They are foundation code, not a working sign-in or provisioning flow.
- Pasted-text validation boundary; file and URL adapters intentionally absent.
- Provider boundary for preparation, evaluation/Supervisor and Errby. It throws before any model call; there is no fake evaluator.
- Sixteen-table schema baseline matching the documented entities, uniqueness/indexes, basic ownership/version constraints, RLS/read policies and no direct client writes.
- Private source bucket migration, 10 MB limit and no client object policies.
- Four deterministic/SQL tests and four Chromium browser smoke tests; CI workflow prepared.
- README with PowerShell commands, database instructions, attribution, limitations and next steps.

## Verification actually run

| Check                             | Result / scope                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency installation           | Passed; all direct packages are pinned. Clean `npm ci --ignore-scripts` reinstall also passed (402 packages); subsequent checks/build/browser tests use that installation. `npm ls --depth=0` passes.                                                                                                                                                          |
| `npm run lint`                    | Passed with zero warnings after fixing the PostCSS default export.                                                                                                                                                                                                                                                                                             |
| `npm run typecheck`               | Passed: Next route generation plus strict `tsc --noEmit`.                                                                                                                                                                                                                                                                                                      |
| `npm test`                        | 4 passed: env validation/no secret error leakage, unreviewed fixture provenance, exact supplied palette and SQL baseline.                                                                                                                                                                                                                                      |
| SQL migration harness             | Both migration files executed in PGlite. Checked 16 tables with RLS, anonymous denial, learner/class isolation, teacher denial of private transcripts, role/score-write denial, hidden join-code hashes, removed membership, duplicate-turn rejection, immutable published content and cross-class session rejection. Auth and Storage schemas are test stubs. |
| `npm run format:check`            | Passed. Original documentation copies are excluded and remain byte-identical.                                                                                                                                                                                                                                                                                  |
| `npm run build`                   | Passed production compilation and TypeScript. `/` and `/api/health` render dynamically, so the demo/live distinction is not frozen at build time.                                                                                                                                                                                                              |
| `npx playwright install chromium` | Passed.                                                                                                                                                                                                                                                                                                                                                        |
| `npm run test:browser`            | 4 passed across 360×800 and 1366×768. Home load, topic preservation, Supervisor/example, theme, no horizontal overflow, no page errors and keyboard skip focus.                                                                                                                                                                                                |
| Visual review                     | Desktop and phone full-page screenshots inspected; no clipping/overlap observed. Screenshots are generated under ignored `test-results/`.                                                                                                                                                                                                                      |
| `npm audit --omit=dev`            | Zero known production vulnerabilities at setup time.                                                                                                                                                                                                                                                                                                           |
| Source preservation               | Zero hash mismatches in copied specification and visual-design folders.                                                                                                                                                                                                                                                                                        |
| Git exclusions                    | `.env.local`, `.next`, `node_modules` and `test-results` confirmed ignored.                                                                                                                                                                                                                                                                                    |
| Docker / Supabase status          | Blocked: `dockerDesktopLinuxEngine` named pipe unavailable; no running local Supabase engine. No remote connection attempted.                                                                                                                                                                                                                                  |
| CI execution / deployment         | Not run; workflow only. No commit or push.                                                                                                                                                                                                                                                                                                                     |

The development server was left running at http://127.0.0.1:3000. A final HTTP request returned 200; `/api/health` returned mode `demo`, status `foundation`, integrations `not_connected`.

## Real versus fixture/stub

The Next.js app, styles, interactions, configuration validation, health route, SQL migrations and checks are real. The only lesson is the supplied generated example, explicitly `draft_needs_teacher_review` and `unverified_until_review`. No invented sources, class membership, authentication session, completion or accuracy metric is presented.

Live Auth, private storage transfers, PDF/DOCX extraction, link/transcript import, resumable preparation, model calls, evaluator decisions, persistent learning sessions, teacher workflows and analytics are **not implemented**. Source format limits in the docs are product requirements, not present capabilities. The fixed Supervisor notice demonstrates the role treatment; it does not judge an answer.

## Remaining external setup and verification

1. Start Docker Desktop's Linux engine, then run the README's local database commands. Verify migrations on real Supabase and test with actual Auth-issued tokens, two teachers and two learners. Test Storage policies/signed URLs as that flow is implemented.
2. Set server environment values only when implementing live integration. No Supabase/OpenAI credentials were supplied, invented or required for demo.
3. Approved teacher provisioning/allowlist and pseudonymous learner Auth credentials must precede writable account/class endpoints. Class code is never authentication.
4. The schema is a restrictive baseline, not completed authorisation: scoped teacher summary RPCs/endpoints, objective/source/evidence validation, audited assessment revision mutations, deletion/retention jobs, idempotent cost reservations and completion transitions still require implementation and tests. Keep direct writes closed until then.
5. Model evaluation on at least 24 reviewed examples across two topics, including false agreement and uncertainty, remains required. No model-quality or latency claims exist.
6. No real pupil data until the documented school/provider/privacy conditions are satisfied. No school trial or legal compliance certification is claimed.
7. Full screen-reader testing, tablet/virtual keyboard tests, 200% text checks and the full product end-to-end suite remain future acceptance work. Supplied token contrast results do not certify complete screens.

## First implementation steps

1. Implement verified teacher/student identity and real Supabase access tests (T02), preserving private-session isolation.
2. Deliver one genuine text/PDF preparation slice: validate/extract privately, retain provenance, review a compact lesson, publish an immutable version, open with its genuine question and persist the learner's answer (T03–T07).
3. Add grounded structured evaluation and a separate Supervisor; validate source IDs, learner evidence and cost reservations before enabling any paid request. Completion stays server-controlled (T09–T12).
4. Complete the required class creation, upload/review/publish, join and scoped results path. Do not trade those requirements for visual polish.

T01 foundation and the bounded T06 preview are delivered. T02–T20 are not marked complete by this setup; none of the product checkpoint gates G1–G5 has been claimed.
