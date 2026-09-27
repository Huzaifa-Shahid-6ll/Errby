# Hosted synthetic verification — 27 September 2026

The application now uses the configured hosted Supabase database and real OpenRouter/OpenAI model. All accounts, source material and answers in this run are synthetic adult software-test data. Automated teacher approval exercised the product permission and publication flow; it does not constitute human content approval or a pupil trial.

## Database and configuration

The supplied pooler credentials connected successfully. Session port 5432 is saved privately in .env.local. Before migration, the existing baseline matched 148 columns, 21 application functions, 13 read policies and 19 table RLS settings against the first 11 local migrations. Their absent history entries were restored, then the CLI dry run selected exactly the five new migrations. All five applied successfully. No baseline tables were recreated or reset.

Local mode is live. The application budget remains enabled at $1 total with a $0.03 maximum reservation per call and the existing 90% admission threshold. Final verified usage is $0.072274, with no unresolved reservations. Credentials and synthetic account IDs remain only in ignored private environment files; none are included here.

## Observed checks

- 25 hosted Auth/RLS checks passed using real password-issued JWTs: profile/class visibility, outsider denial, secret-column/billing/service-RPC denial, token refresh and signed-out refresh rejection.
- 27 actual browser checks passed: teacher source extraction, real lesson generation, source-reference editing, synthetic approval/publication, learner class joining, real answer evaluation, completed results, phone transcript/results, teacher scoped results and outsider denial.
- The same browser acceptance harness passed against the final optimized production server, reusing the saved published lesson and completed session. Its API reads use browser fetch so Chromium handles secure cookies on the local loopback origin; the initial production rerun exposed a test-client cookie mismatch, not an application authentication failure.
- Authenticated PDF and DOCX uploads both passed against the final production server, including real parser execution and hosted source persistence. `scripts/verify-hosted-upload.ts` preserves this live regression check.
- Private source generation produced an owner-only private-ready lesson with teacher review still pending. Real evaluation persisted evidence and completed its required objectives.
- A real multi-turn scenario passed incorrect answer → Supervisor correction → exact copied correction without completion → fresh independent explanation → completion. Reprocessing did not duplicate transcript messages. Earlier attempts exposed duplicate-objective model output and copied-prompt uncertainty handling; those defects were fixed before the final successful run.
- Hosted assessment revision denied the unrelated learner, preserved original model evidence, rejected a stale expected verdict and restored completed status after two explicit synthetic audit revisions.
- Hosted retention redacted a disposable synthetic conversation aged 31 days and deleted it at 91 days. Deleting that temporary Auth user also removed its profile and membership. The three main demo accounts remain available. Three abandoned debug sessions were removed; successful private and class sessions remain.
- All 24 final candidate judgments matched both expected verdict and independence under evaluator-2026-09-27-v6. These AI-authored candidate expectations still require human review. Earlier runs had mismatches; this is a development evaluation, not an independent accuracy benchmark or guarantee.
- Final local lint, TypeScript, 43 tests and formatting pass. The optimized live-mode production build and isolated DOCX packaging pass. The earlier 70 distinct mocked/demo browser cases remain separately documented in T18_QA.md.

## Defects found only with live integration

1. Provider structured output rejects URI format and oneOf. The shared adapter now emits the supported wire schema; original application Zod validation still runs afterward.
2. Supabase embedding was ambiguous because lessons and versions have two relationships. All four affected reads now explicitly select the lesson_id foreign key.
3. Redundant model-generated Supervisor selection conflicted with verdicts. The application now derives intervention type and authored correction from validated assessments.
4. Model assessment output is bounded by the actual objective count; duplicate sentence-level assessments are rejected/repaired. Unverified/off-topic evidence cannot be independent, and exact copied corrections cannot earn independent credit or falsely force a new factual-review dead end.
5. Turbopack replaced statically resolved DOCX worker paths with numeric bundle IDs. Native resolution from the runtime package root now supplies actual filesystem paths, while an explicit parser import keeps its dependencies in the production trace. Both isolated packaging and actual authenticated production DOCX extraction pass.

## Final candidate cases

| Case        | Expected verdict | Observed verdict | Independent | Result |
| ----------- | ---------------- | ---------------- | ----------- | ------ |
| heat-01     | correct          | correct          | true        | Pass   |
| heat-02     | partial          | partial          | true        | Pass   |
| heat-03     | incorrect        | incorrect        | true        | Pass   |
| heat-04     | incorrect        | incorrect        | true        | Pass   |
| heat-05     | incorrect        | incorrect        | true        | Pass   |
| heat-06     | incorrect        | incorrect        | true        | Pass   |
| heat-07     | unverified       | unverified       | false       | Pass   |
| heat-08     | unverified       | unverified       | false       | Pass   |
| heat-09     | correct          | correct          | false       | Pass   |
| heat-10     | correct          | correct          | true        | Pass   |
| heat-11     | correct          | correct          | true        | Pass   |
| heat-12     | partial          | partial          | true        | Pass   |
| fraction-01 | correct          | correct          | true        | Pass   |
| fraction-02 | partial          | partial          | true        | Pass   |
| fraction-03 | incorrect        | incorrect        | true        | Pass   |
| fraction-04 | incorrect        | incorrect        | true        | Pass   |
| fraction-05 | incorrect        | incorrect        | true        | Pass   |
| fraction-06 | incorrect        | incorrect        | true        | Pass   |
| fraction-07 | unverified       | unverified       | false       | Pass   |
| fraction-08 | unverified       | unverified       | false       | Pass   |
| fraction-09 | correct          | correct          | false       | Pass   |
| fraction-10 | correct          | correct          | true        | Pass   |
| fraction-11 | correct          | correct          | true        | Pass   |
| fraction-12 | partial          | partial          | true        | Pass   |

## Re-running

Use scripts/verify-hosted.ts with .env.local and the ignored .env.hackathon for Auth/RLS. Use scripts/verify-hosted-browser.ts against the running local live server. Use scripts/verify-ai.ts with the react-server condition and --corpus for the explicit paid corpus gate; it reuses cached responses and stays under the durable budget. Never run provisioning twice over existing credentials.

Remaining external acceptance: genuine teacher review, human/screen-reader walkthrough, school approval for any pupil pilot, public deployment, recording and submission. Retention has an operator command; no scheduled retention job is claimed. No commit, push or deployment was performed.
