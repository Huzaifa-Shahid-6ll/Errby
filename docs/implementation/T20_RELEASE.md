# T20 candidate release and demo record

Status: **local production candidate; hosted synthetic journey verified** (27 September 2026). Real provider generation, evaluator/reply integration, hosted authentication and scoped results passed synthetic acceptance; see [observed verification](HOSTED_VERIFICATION_2026-09-27.md). No public candidate was deployed, no video was recorded, and no submission was made. T19 has no human participants. Local fixtures remain fictional and unreviewed.

## Clean setup and candidate gate

On a fresh checkout on Windows PowerShell with Node 24.18.0 and npm 11.16.0:

```powershell
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
$env:ERRBY_MODE = 'demo'
npm run check
npm run build
npm run test:packaging
npx playwright install chromium
npm run test:browser
npm run dev
```

Use `ERRBY_MODE=demo` with empty credentials and open `http://127.0.0.1:3000/learn`. Demo shows labelled fictional conversation and real local extraction without sign-in or AI billing. `npm run db:test` is an optional focused SQL check using PGlite; it does not verify Supabase Auth, Storage or hosted row policies. Never use local Docker. Keep keys only in ignored private configuration, never tracked files, terminal recordings or screenshots. If a command fails, record the command, error, commit and environment; do not mark that gate passed.

## Hosted synthetic setup

1. Select the dedicated synthetic Supabase project. Disable public signups and preserve provider email confirmation. Privately configure `.env.local` with the project URL, publishable and secret keys, OpenRouter key, `OPENROUTER_MODEL=gpt-4.1-mini`, and `ERRBY_MODE=live`. The provider adapter rejects other models. Keep all keys server-only.
2. Obtain a reachable migration connection and apply **all missing migrations in filename order**. The original direct database host was IPv6-only and unreachable here. This was resolved with the session pooler; all current migrations have now been applied. On IPv4, use **Connect → Session pooler**, port **5432**, in the Supabase dashboard; keep that full connection privately in optional `SUPABASE_DB_URL`. This variable is migration-only and is not read by the app or automatically applied by `npm run dev`. Do not substitute the transaction pooler on port 6543 for migration/session tooling. [Supabase connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres).
3. If using the installed Supabase CLI, supply its access token and database password through private process environment variables `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`, never literal command arguments. Link only the intended hosted project, inspect the dry run, then apply. The CLI's normal linked connection can use the pooler; do not pass `--skip-pooler` on an IPv4-only machine. If it still cannot connect, use the selected project's SQL editor to apply missing files after inspecting existing schema/history; do not replay the non-idempotent baseline blindly. [Supabase CLI documentation](https://supabase.com/docs/reference/cli/supabase-db-push).

```powershell
$projectRef = Read-Host 'Synthetic Supabase project reference (not a secret)'
npx supabase link --project-ref $projectRef
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npx supabase db push --linked
```

These remote commands do not require starting local Docker. Credentials and the SQL connection must be supplied privately before running them; commands here are instructions, not executed acceptance evidence. Check migration history and the actual functions/tables afterward, including model dispatch, preparation generation, teaching loop and results revisions.

4. Create a synthetic adult teacher Auth account using the provider's confirmed-email process. Put its email in `ERRBY_APPROVED_TEACHER_EMAILS`, and set `ERRBY_OPERATOR_CONFIRM=synthetic-test-project` in ignored `.env.local`. Approve the known Auth UUID through stdin, then sign in at `/setup` and create a class at `/classes`.

```powershell
@{ operation='approve-teacher'; userId='<confirmed-auth-user-uuid>'; alias='Synthetic teacher A' } | ConvertTo-Json -Compress | npm run account:manage
```

5. Provision a synthetic learner for that teacher's active class. The CLI prints its generated username/password once; use a private terminal and deliver them securely. No password belongs in chat, screenshots or the repository.

```powershell
@{ operation='create-learner'; teacherId='<approved-teacher-uuid>'; classId='<owned-active-class-uuid>'; alias='Synthetic learner A' } | ConvertTo-Json -Compress | npm run account:manage
```

6. Inspect the budget and enable only the agreed synthetic verification allowance. The current command ceiling is $1 total and $0.03 per call, with a reservation stop at 90% of the total. A key alone never enables dispatch. Unknown outcomes continue consuming reserved capacity until manually reconciled.

```powershell
'{"action":"status"}' | npm run ops:manage
'{"action":"budget","capUsd":1,"maxCallUsd":0.03,"enabled":true}' | npm run ops:manage -- --confirm
Remove-Item Env:ERRBY_MODE -ErrorAction SilentlyContinue
npm run dev
```

7. Use separate browser profiles for teacher and synthetic learner. Prepare a short factual source, generate and human-review its draft, publish it, then complete the learner → reply → correction → progress → recap path. Reload and retry once to verify persistence without duplicate billing/evidence. Return through saved learning, then inspect class-scoped results. Private AI practice must retain its not-teacher-reviewed label and stay outside teacher results. Complete the cross-class and revoked-membership checks before calling the journey accepted.
8. Inspect spend, arrange and verify daily retention, and disable new AI calls when the synthetic session is over. [T17 commands](T17_OPERATIONS.md) cover manual reconciliation, retention and the explicit destructive class-removal path. A source-based generated draft is not human approval, and `zdr` routing flags do not establish school privacy acceptance.

```powershell
'{"action":"status"}' | npm run ops:manage
'{"action":"budget","capUsd":1,"maxCallUsd":0.03,"enabled":false}' | npm run ops:manage -- --confirm
```

## Candidate acceptance

Before a hosted candidate, the lead must configure a **non-local synthetic test project** with all migrations in filename order and privately provision test accounts. Verify actual Auth-issued tokens, refresh/revocation, two-class isolation, private-session exclusion, Storage denial, account deletion, retention scheduling and concurrent budget reservations against the hosted services. A passing PGlite test or mocked browser response cannot substitute. Review the T03 lesson content with a teacher, execute evaluator cases with an approved provider only after cost reservations/caps and explicit paid-call authorization, and clear the T18 tablet/zoom and screen-reader checks. Run a real phone/tablet/desktop smoke pass for sign-in, class code, source preparation, teacher review/publish, learner opening question, saved answer/retry/resume, Supervisor role, results and sign-out. Block release on false completion, unverifiable correctness, cross-class exposure, lost answer, duplicate grading, inaccessible essential controls or broken school path.

Record the hosted URL, commit, migration set, test account identifiers without credentials, device/browser results, measured latency for slow steps, security findings and unresolved defects in a private release log. Inspect logs and screenshots for secrets or personal data. Test public URL and cold reload, production build, responsive widths, keyboard focus and 200% text. No performance target is claimed from local compilation or a screenshot; measure hosted action timings before making one. Deploy, public repository visibility and submission require separate authorization and completed gates.

## Four-minute recording script

Use synthetic accounts and a teacher-reviewed short lesson. Put a visible caption on every segment: **live hosted flow**, **local interface preview**, or **previously recorded real flow**, with date/build. Never splice a fixture into a live segment without relabelling it. Hide passwords, join codes, email addresses, keys, raw chat and browser developer tools containing them. Record only after confirming the displayed lesson and captures are safe. Do not claim school participation or learning gains.

| Time      | Screen and narration                                                                                       | Required evidence or honest fallback                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 0:00–0:25 | Explain Errby's learner-as-teacher idea and distinct Supervisor.                                           | Product claim only; no efficacy claim.                                                                        |
| 0:25–1:10 | Teacher signs in, prepares fictional material, reviews source-backed objectives and publishes.             | Show actual reviewed live path if verified; otherwise label interface preview and state publication limit.    |
| 1:10–1:35 | Learner joins the class and opens the genuine first question.                                              | Keep class code obscured; show real session only if hosted accepted.                                          |
| 1:35–2:35 | Learner explains, Errby makes a bounded mistake, Supervisor flags it, learner corrects with a new example. | If evaluator disabled, show a labelled authored/fictional example. Never narrate it as live model evaluation. |
| 2:35–3:10 | Show saved objective evidence, learner recap and class-scoped teacher status.                              | State which values are persisted and which remain unmeasured; never pass uncertain evidence.                  |
| 3:10–3:45 | Team members explain their own concrete work, one bug and how they checked it.                             | Use the contribution log below; no attribution by assumption.                                                 |
| 3:45–4:00 | State tested scope, missing gates and next step.                                                           | Show build/URL and explicit limitation caption.                                                               |

Record a first take, review audio/captions, then capture a final 3–5 minute file and screenshots with synthetic labels. Store raw takes privately; publish only a reviewed recording. If hosting or provider fails, use a clearly labelled recorded real segment where available and state what does not work now. No recording exists until a file is actually created and reviewed.

## AI disclosure and contribution evidence

The README must disclose substantial Codex assistance with implementation, tests, specifications and generated visual concepts. Review all generated content before use; describe model-generated UI fixtures as fictional and unreviewed. Name third-party packages and licences through the checked package manifest. The official FirstCommit rules and deadline are recorded in [launch specification](../specification/LAUNCH_AND_DEMO.md); recheck them before submission because event details can change.

Complete this table from actual commits, reviewed artifacts and each person's own explanation. Leave unknown fields blank; agent output does not prove teammate contribution.

| Person / role       | Genuine work and learning | Evidence link / commit | Review and test performed | Recording segment |
| ------------------- | ------------------------- | ---------------------- | ------------------------- | ----------------- |
| Lead                |                           |                        |                           |                   |
| UI/QA teammate      |                           |                        |                           |                   |
| Content/QA teammate |                           |                        |                           |                   |

Before submission, confirm the repository is public with meaningful development history, exact team work and attribution, a tested clean setup, a working judge URL, a reviewed video and no secrets or real pupil data. Record actual outcome here when those actions occur; do not backfill success from this plan.

## Current evidence and limits

The final local quality gate passes 43 tests, lint, TypeScript and formatting. The optimized live production build and packaging check pass. Hosted synthetic Auth, the actual browser journey and 24 real-model candidate cases passed as recorded in [hosted verification](HOSTED_VERIFICATION_2026-09-27.md). Human review/walkthrough, scheduled retention, public deployment and submission remain unclaimed.
