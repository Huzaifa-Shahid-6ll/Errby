# T10 — approved next-turn selection

Implemented a server-only, deterministic next-turn boundary on 26 September 2026. It validates T09 output against the version-pinned lesson and learner answer, requires teacher approval and checked source evidence, selects each authored misconception at most once, and uses authored follow-up/application prompts. An unresolved misconception routes to an authored changed-example question or an authored Supervisor correction; it cannot be repeated as Errby's next error. Uncertainty, missing approval, or missing correction evidence returns `needs_review`.

The output is a proposed server turn, not a saved message. A caller must atomically store its message, misconception ID, unresolved-correction state, citations and session status. T11/T12 own that integration. The T09 validator checks structure and provenance, not semantic correctness; no model-generated evaluation or reply is claimed. The provider remains disabled pending authorised cost reservations/caps, provider eligibility and a reviewed lesson. Fictional fixtures are used only in tests.

Checks: `node --conditions=react-server --import tsx --test tests/next-turn.test.ts`, targeted ESLint and `npm run typecheck` pass. Hosted Supabase Auth, live provider and teacher approval remain unverified.
