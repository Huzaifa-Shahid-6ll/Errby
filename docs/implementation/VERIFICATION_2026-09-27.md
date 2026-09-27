# T01–T20 verification — 27 September 2026

## Repair verification addendum

The task verdicts below preserve the original audit. Subsequent task-pair implementation fixed the disconnected AI teaching loop, revoked-access reads, draft recovery, saved-session discovery, private preparation, wrong-objective corrections, results metrics/revisions/activity and DOCX production tracing. The current task table and outstanding acceptance are in [setup status](../SETUP_STATUS.md).

Final local gates: `npm run check` passes (lint, TypeScript, 43 non-browser tests and formatting); optimized production build passes; isolated DOCX packaging passes for both ingestion routes. Agents verified 70 distinct browser cases across desktop/phone runs. Production startup returned HTTP 200 for health, landing, learning home, setup and preparation; demo session mutation remained denied. The final quality gate also caught and fixed a TypeScript cast in the new activity browser test. Production packaging is now included after build in CI; remote CI itself has not run.

Hosted migration and the real-provider journey remain pending a reachable Session pooler database connection. No paid model call, hosted migration, human lesson approval, participant pilot, commit, push or deployment is claimed by this repair. The following findings describe the pre-repair snapshot.

**Verdict: not complete end to end.** Four sub-agents reviewed five required tasks each against `docs/specification/IMPLEMENTATION_TASKS.md`, relevant specifications, application callers and SQL. The coordinator reviewed shared wiring and ran local checks. “Implemented locally” below does not mean hosted acceptance has passed.

## Task verdicts

| Task | Verified scope                                               | Remaining acceptance or defect                                                                     |
| ---- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| T01  | Repository, environment validation, schema, CI configuration | Current full quality gate is not green; fresh checkout and remote CI not rerun.                    |
| T02  | Identity/provisioning and local isolation checks             | Actual hosted JWT, refresh/revocation, recovery and RLS acceptance; refresh coverage gap below.    |
| T03  | Lesson contracts and candidate example corpus                | Examples remain fictional and teacher review pending; no reviewed pack.                            |
| T04  | Text/PDF extraction, bounded inputs and recovery             | Hosted authenticated upload acceptance.                                                            |
| T05  | Durable preparation, immutable versions, leases, retry keys  | Hosted persistence; learner private preparation stops before lesson creation.                      |
| T06  | Fixture composer/sidebar/list                                | Live workspace omits composer/sidebar and saved-session discovery.                                 |
| T07  | Session opening and first-answer persistence                 | Hosted verification; complete conversation blocked after first answer.                             |
| T08  | Three-role chat and state rendering                          | Real Supervisor/reply production absent; recovery loses edited drafts.                             |
| T09  | Decision validator and 24 candidate expectations             | No implemented classifier, observed model evaluation or human-reviewed corpus.                     |
| T10  | Isolated authored next-turn selector                         | No application caller or persisted reply; correction can target wrong objective.                   |
| T11  | Evidence validator and completion transaction                | No application caller; objective progress not projected into chat.                                 |
| T12  | Pause/resume and local deduplication                         | Draft-loss bug, no resume/history entry, no live evaluator replay.                                 |
| T13  | Create class, rotate code, preview and confirm membership    | Hosted synthetic Auth/RLS acceptance.                                                              |
| T14  | Teacher source → manual draft → review → publish             | No complete real-school walkthrough; contradictory publication labels.                             |
| T15  | Scoped recap/roster and first-independent-attempt calculator | Missing activity/correction metrics and reviewed revisions; evidence keyed by title.               |
| T16  | DOCX parser and honest link/pasted-text fallback             | DOCX load timeout in broad run; deployment trace missing parser; hosted upload acceptance.         |
| T17  | Budget SQL, deletion endpoint, retention function            | Provider/budget integration and recovery absent; retention unscheduled; teacher deletion dead end. |
| T18  | Local browser scripts and responsive fixes                   | No complete live teacher/learner/results walkthrough; screen-reader acceptance open.               |
| T19  | Walkthrough/pilot protocol                                   | Not conducted; zero participants and no genuine feedback.                                          |
| T20  | Release checklist, recording script, disclosure template     | No candidate deployment, recording, submission or accepted clean setup.                            |

Optional T21 styling/transitions are substantially present, subject to browser verification. Optional T22 automatic external-source extraction is intentionally absent; URL metadata plus pasted text is the implemented fallback.

## Blocking connections and defects

**Release-blocking authorization defect, reproduced:** session GET bypasses revoked class access. `src/lib/sessions/server.ts:31` supplies an admin client; `src/lib/sessions/service.ts:170–183` checks learner ownership but not current membership, active class or lesson archive state. Using actual migrations and the existing PGlite adapter, removed membership and inactive class each produced zero readable sessions/versions under the authenticated role, while the privileged HTTP handler returned 200 with the conversation. An archived lesson likewise had no readable version under authenticated SQL but remained exposed through session GET. This contradicts immediate revocation in `PRIVACY_AND_SAFETY.md:15`. The ignored reproduction is `test-results/revocation-audit.test.ts`, run with `node --conditions=react-server --import tsx --test --test-name-pattern='PGlite only' test-results/revocation-audit.test.ts` (one passing reproduction). It proves local SQL/service behavior, not hosted Auth. Fix authorization at the shared session read boundary and add a permanent denied-access regression.

1. **The teaching loop stops after the first submitted answer.** `src/lib/sessions/service.ts:199` records the turn; `supabase/migrations/20260922000100_learning_sessions.sql:76` moves it to `evaluating`. There is no production caller of `selectNextTurn` or `recordObjectiveEvidence`. `src/lib/ai/server.ts:7` always throws. The UI honestly says evaluation is unavailable, but cannot deliver follow-up teaching, Supervisor intervention or evidence-based completion. Budget reservations/settlement likewise have test callers only.
2. **Failed-send recovery discards later edits, reproduced in Chromium.** `src/app/learn/sessions/[id]/session-view.tsx:99` saves `turn.current` in preference to current textarea text. After submitting A unsuccessfully, editing to B and reloading restores A. The ignored runnable probe `node test-results/draft-recovery-audit.mjs` returned `expected: Edited fictional explanation B`, `actual: Original fictional explanation A` and exited 1. It uses explicitly mocked synthetic API responses and the real UI. Reconciliation at lines 134–145 can also clear B if it discovers that A was actually saved (static finding). A permanent regression is still needed with the repair.
3. **Saved learning is not discoverable.** Live `src/app/learn/page.tsx:20` queries published lessons, not saved sessions. `src/app/learn/start-lesson.tsx:22` always starts another session. Returning from a paused session gives no history/resume entry. Live home also omits the demo composer/sidebar and still tells teachers that class/review tools arrive later.
4. **Private learner preparation ends in a dead end.** `src/lib/preparations/service.ts:280` disables automatic drafting; draft authoring is teacher-only and preparation reads are owner-only. A learner cannot turn their private prepared material into a usable lesson through the available UI.
5. **DOCX deployment packaging is incomplete, confirmed after a fresh successful build.** `src/lib/ingestion/docx-worker.ts:6` requires Mammoth inside an evaluated string. `next.config.ts:13` includes PDF.js assets only. The fresh extraction/preparation route traces contain 107/108 files and zero Mammoth paths. Include the parser and its transitive dependencies, then verify the packaged routes before release.
6. **New authenticated routes omit established refresh handling.** `src/proxy.ts:46` does not match `/classes`, `/api/classes/**` or `/api/account`; `src/lib/db/server.ts:23` ignores refresh writes by default. Hosted expired-session behavior is unverified, but the cookie propagation wiring differs from preparation/session routes.
7. **Publication UI contradicts persisted state.** `src/app/prepare/[id]/saved-preparation.tsx:161` and `:489` always say teacher review required / Unreviewed, including after publication. The server already returns `review_status`.
8. **Results can show the wrong evidence.** `src/lib/results/service.ts:139` associates evaluations with goals by title, although lesson validation allows distinct objective IDs with identical titles. Match by ID. Active-time collection, accepted correction metrics, uncertainty details and audited teacher assessment revisions required by `ANALYTICS.md` / `USER_FLOWS.md` are absent.
9. **Next-turn correction can address the wrong objective.** `src/lib/ai/next-turn.ts:57` prioritizes any active misconception when a correction is triggered, without first matching it to the incorrectly assessed objective. Bind the correction to the relevant objective before connecting the selector.
10. **Teacher account deletion has no actionable recovery.** `src/app/api/account/route.ts:65` requires class removal/transfer, but no such UI/API is exposed. Preserve the protective block and supply an operator route or class lifecycle action. Retention SQL has no scheduled caller; budget tests do not test account deletion or retention.
11. **Teacher class-loading failures are hidden.** `src/app/prepare/page.tsx:12` ignores the class query error and uses an empty list. This encourages private preparation when class lookup failed; that private draft cannot follow the class publication path.
12. **Default test wiring omits four suites.** `package.json` excludes `evaluation.test.ts`, `next-turn.test.ts`, `results.test.ts` and `budget.test.ts` from `npm test`, so CI's `npm run check` also omits them. They were run explicitly in this review.

## User journey verdict

- Landing → sign-in guidance/demo: implemented locally; synthetic hosted login still needs acceptance.
- Teacher → class → source → manual draft → publication: connected in code and local SQL checks, with confusing state labels and no complete hosted walkthrough.
- Learner → class join → published lesson → opening question → saved first answer: connected locally; hosted identity/persistence unverified.
- Saved first answer → evaluation → Supervisor/Errby reply → objective progress → completion → meaningful results: **disconnected**.
- Pause → workspace → resume: saved state exists, but discovery is missing; edited draft recovery is defective.
- Teacher results → flagged claim → audited revision: not implemented.

The whole user flow cannot currently be described as natural or working. Passing fixture or mocked UI checks cannot close these gaps.

## Verification evidence

- Configuration presence check (values not printed): mode is `demo`; hosted URL, publishable key and secret key are populated; provider key is absent. This supersedes the older setup note about an empty secret. Credential validity, test-account access and applied hosted migrations were not established.
- TypeScript and route generation: passed.
- Foundation/database/lesson checks: 11 passed.
- Direct combined identity/ingestion/preparation/session/class/publication run: 15 passed, one DOCX parser-timeout failure. `npm test` also stopped at that failure.
- DOCX-only retry: passed in 10.8 seconds. This supports a load-sensitive startup failure, not a consistently broken local parser; the original broad run remains failed.
- Full `npm test` rerun: all 27 checks passed, including DOCX. Together with the five separately invoked omitted checks, 32 existing non-browser checks passed. The failed initial run is retained above for reproducibility.
- Explicit evaluation/next-turn/results/budget suites: all five checks passed. These validate deterministic contracts/calculators/SQL, not model quality or production orchestration.
- Formatting: failed in 33 files, including animation evidence and next-turn source/tests.
- Default browser command: failed before tests because the development server exceeded its 120-second readiness deadline. The first temporary override inadvertently retained the original web server through config merging and also timed out. Corrected configuration uses one web server, `/api/health` readiness and a 300-second deadline; 56 tests started. Final outcome recorded below.
- Full lint: failed with one `react-hooks/set-state-in-effect` error at `src/app/learn/sessions/[id]/session-view.tsx:80`; the historical `.pi` errors are not the current result.
- The first production build compiled but its type-check stage caught a type error in the audit's ignored temporary Playwright config. The audit config was corrected; this is not an application defect. A fresh build was started afterward.
- Production build rerun: passed compilation, TypeScript, page generation and route output. This does not fix the missing DOCX tracing or establish hosted behavior.
- Corrected full browser run: 50 passed, six failed out of 56. Both tablet/200% text checks passed. Failures: one desktop FAQ fragment/reload viewport assertion; three desktop preparation setup/compilation/transport timeouts (phone equivalents passed); two retry tests expecting obsolete copy `Your unsent draft is still held` while the UI says `Your unsent draft is held in this tab for recovery.` Those two are stale test assertions, separate from the independently reproduced draft-loss bug.
- Focused rerun of all six browser failures: four passed; only the two stale-copy assertions failed again. Therefore 54 distinct browser checks passed across runs, but no completely green single run is claimed. The FAQ/three preparation failures did not reproduce on the warm rerun. The 360px home screenshot was inspected and showed no horizontal clipping; that fixture preview does not establish live usability.
- Audit documentation formatting and `git diff --check`: passed. No application fixes were made in this review; the defects and repair order remain open.

No Docker operation, paid provider call, real pupil data, hosted mutation, commit, push or deployment was performed. Existing user edits were preserved. Only this audit and a setup-status addendum are intended tracked changes.

## Repair order

1. Fix revoked-access exposure, recovery/data-association defects and add targeted regressions; repair refresh and packaging coverage; include omitted tests in CI.
2. Connect answer processing to validated evaluation, reservations, Supervisor/Errby replies, evidence and completion atomically, with retries and explicit failure states. Paid execution still requires authorization.
3. Complete saved-session discovery, live workspace navigation, private preparation, teacher review/revisions and required metrics.
4. Verify a hosted synthetic teacher → learner → results journey, role isolation, refresh, deletion/retention and keyboard/phone/tablet/screen-reader access.
5. Obtain human lesson approval and genuine walkthrough feedback; only then finish release acceptance under separate deployment authorization.
