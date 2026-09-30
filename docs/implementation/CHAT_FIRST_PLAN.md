# Chat-first entry: focused hackathon plan

30 September 2026. Scope confirmed by the user after review.

Follow-up: the user subsequently requested document-upload UX and OpenRouter streaming. The chat composer now supports PDF/DOCX extraction and reviewed excerpts, streamed ungraded replies, and real preparation/session status events. This supersedes the typed/pasted-only boundary below; retired teacher and preparation screens remain retired. See the latest setup-status entry for verification and limitations.

## Keep the original idea

The student teaches Errby. Errby remains a curious AI learner, with bounded misunderstandings. The Supervisor checks the learner's evidence and intervenes when needed. Preserve the existing objectives, assessment, correction, completion, retry, privacy and spending controls.

The user explicitly approved preparing objectives internally after a topic is supplied. No lesson-planning screen, teacher approval or class membership may stand between authentication and the chat composer. Progress stays quiet and the Supervisor works invisibly; its corrections must still reach the student through Errby. Typed messages and pasted notes only.

## Reviewed code and implementation

1. Keep the existing Clerk redirects to `/learn`; replace its teacher/class/preparation dashboard with chat and private saved history.
2. Add a small authenticated chat-entry adapter. A greeting or topic starts a natural, ungraded conversation. Pasted reference notes use the existing private preparation and session services internally. Preserve opening drafts/retry identity in the current browser tab; make that storage limit clear.
3. Reuse the existing saved-session component and evaluator. Hide goal panels and render Supervisor guidance through Errby without changing stored role semantics, evidence validation or copied-correction detection.
4. Remove teacher/class navigation, screens and public APIs, teacher publication/review controls and related account/landing copy. Remove upload/preparation screens from the active journey. Keep historical schema/migrations and records; do not rebuild or destructively clean the database.
5. Keep the existing palette, layout primitives, provider, model caps and server-only boundaries. No new framework, database, agent service or broad visual redesign.
6. Verify new entry/retry behavior plus existing auth, private-session, evaluation and recovery logic; run type/lint/format, relevant browser tests and production build. Record hosted limitations separately.

## Important existing constraint

The current learning engine requires source evidence for evaluated progress. A topic alone supplies scope. The entry chat can ask questions naturally without grading; pasted notes let the existing source-grounded teaching loop start. Do not relabel student answers or model-generated claims as independently verified evidence merely to bypass this rule. Unsupported or uncertain claims never complete learning.

## Acceptance

- Authentication opens a usable chat composer, with no AI call on page load.
- Greetings, topics and pasted notes work without a wizard or teacher step.
- Errby remains the learner and the student does the explaining.
- Quiet progress retains exact learner evidence and original completion safeguards.
- Supervisor corrections remain visible in Errby's conversation; the Supervisor is not a separate visible speaker.
- Saved private sessions, retries and drafts behave honestly across errors/refresh.
- Retired teacher/class/preparation/upload routes cannot perform their former user-facing actions.
- Anonymous and foreign users cannot read or mutate another student's records.
- Phone/desktop layout, keyboard interaction and error messages work.
- Fictional demo content never claims real AI, grading or persistence.

## Research basis

Simple composable model calls are preferable until additional orchestration has demonstrated value: [Anthropic, Building effective agents](https://www.anthropic.com/engineering/building-effective-agents). This supports reusing Errby's current server functions.

Authentication and authorization belong at the data/API boundary: [Next.js authentication](https://nextjs.org/docs/app/guides/authentication). Consulted Context7 `/vercel/next.js` and installed Next 16.3.5 route-handler documentation.

Private records need owner-scoped policies and restricted function execution: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Consulted Context7 `/supabase/supabase`.

## Scope and status

The earlier replacement-schema draft was discarded; no replacement conversation engine is planned. No Docker, real pupil data, commit, push or deployment. Local checks and provider mocks do not establish hosted Clerk/Supabase or real model behavior. Implementation results belong in `docs/SETUP_STATUS.md`.
