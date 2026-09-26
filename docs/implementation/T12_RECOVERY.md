# T12 — session recovery

Implemented 26 September 2026. Learners can pause and resume an owned, unfinished session through a service-role-only transaction that locks the session and preserves its prior state. The saved conversation reloads from the server. The browser tab keeps an unsent draft and retry key in session storage; an ambiguous submission is reconciled against the saved message before retry. The existing turn transaction accepts one learner message per retry key and sequence.

The evidence transaction now treats an identical assessment replay for the same saved answer as read-only. Conflicting replays fail; the first assessment remains authoritative. This prevents duplicate objective progress revisions and completion writes. The evaluator is still disabled, so this path is verified only with synthetic PGlite data and cannot imply observed grading or hosted Supabase behaviour.

Files: `supabase/migrations/20260926000200_session_recovery.sql`, `src/lib/sessions/{service,request,server}.ts`, `src/app/api/sessions/[id]/pause/route.ts`, and `src/app/learn/sessions/[id]/session-view.tsx`. No paid calls or real pupil data. Hosted Auth/session verification and live evaluator orchestration remain pending.

Local verification: `npm run test:sessions` (2 pass) and `node --conditions=react-server --import tsx --test tests/database.test.ts` (1 pass, including duplicate evidence and pause/resume assertions). Browser and hosted acceptance remain pending.
