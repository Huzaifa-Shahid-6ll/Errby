# T20 candidate release and demo record

Status: **release preparation only** (26 September 2026). No candidate was deployed, no video was recorded, and no submission was made. T19's walkthrough has no participants. Local fixtures are fictional and unreviewed. The server model adapter remains disabled; authored replies and UI examples are not observed AI grading.

## Clean setup and candidate gate

On a fresh checkout on Windows PowerShell with Node 24.18.0 and npm 11.16.0:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run dev
```

Use `ERRBY_MODE=demo` with empty credentials and open `http://127.0.0.1:3000/learn`. `npm run db:test` is an optional focused SQL check using PGlite; it does not verify Supabase Auth, Storage or hosted row policies. Never use local Docker. Do not copy real credentials, names, chat or pupil work into a checkout, terminal recording, screenshot or repository. If a command fails, record the command, error, commit and environment; do not mark this gate passed. Full repository lint currently encounters unrelated `.pi/extensions` findings, so record scoped checks separately without presenting them as a clean full check.

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

T17 PGlite budget/deletion checks and T18 typecheck/scoped lint are documented in their task notes. T18's tablet browser readiness timed out before its test ran; screen-reader verification remains open. T19 prepared a protocol but did not conduct a walkthrough or pilot. T20's documentation and local verification are preparation evidence only. No G5 release gate is claimed.
