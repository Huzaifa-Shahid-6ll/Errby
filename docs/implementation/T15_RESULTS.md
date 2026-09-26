# T15 results and teacher summaries

The learner recap reads one owned saved session. The teacher API and page check the authenticated teacher's class ownership before querying, then select only `visibility='class'` sessions for that class and a single published lesson version. They show the latest session for each active class member. No transcript or private session is returned to teachers.

Required goal state comes from saved `objective_progress`. First try counts each required objective's first independent, unassisted, scorable evaluation; unverified and off topic evaluations are excluded and counted separately. The new migration preserves the evaluator's independent flag; historical evaluations have `NULL` and cannot enter the first try denominator. Unresolved interventions or required unverified goals take precedence. A session is labelled Explained only when persisted status is completed and all required goals are explained.

`active_ms` remains zero until a visibility-aware activity collector exists; the UI says Not measured. Distinct misconception corrections cannot yet be computed because no accepted correction-to-misconception link is persisted. Neither metric is fabricated. Teacher evidence display shows objective states, not raw learner text. A no-score state is explicit.

Verification: `tests/results.test.ts` checks a hand-computed fixture; `npm run db:test` applies the forward migration through PGlite. Hosted Auth/RLS and Storage remain unverified without a configured synthetic Supabase project.
