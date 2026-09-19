# T06 — Learning workspace

## Implemented scope

- `/learn` renders a responsive home composer, labelled sidebar, class lesson list and inline lesson preview in demo mode. The standalone T05/T06 commit redirects `/` to `/learn`; the separate, uncommitted landing-page task can replace that public route. No landing-page component is required by this implementation.
- The class list uses the existing T03 heat-transfer and fractions drafts, with only titles, opening questions and objective labels sent to the client. Every preview is explicitly fictional and unreviewed. No class membership, published availability, learner score or saved session is invented.
- The native preview-scenario selector covers returning learners, new learners with no class and a pending-preparation illustration. The pending illustration explicitly says no background job exists. The Resume section explains that teaching sessions are not implemented; the preparation page handles actual saved preparation jobs in live mode through T05.
- Prepare lesson rejects empty/whitespace input, retains the composer while browsing fixtures and moves the draft into `/prepare`. Add material opens the same source form, where the permitted text/PDF options and limits are explained. Links are not fetched.
- Draft handoff uses memory in the current browser tab only. No source text enters a URL, localStorage or sessionStorage. The preparation form clears the handoff after successful submission and retains it on failure; a hard refresh discards an unsaved draft. This does not claim durable recovery before T05 has saved a preparation.
- Sidebar destinations are real routes or focusable in-page sections. Skip navigation, keyboard example opening/closing with focus restoration, native form controls, visible role names/icons, 44px minimum button targets, wrapping long text and reduced-motion styles are included. The existing exact palette tokens are unchanged. Home theme control updates the document theme without depending on the separate landing page.
- Live `/learn` renders verified account context and preparation/account links only. It never falls back to fictional records or implies an authenticated account when none exists.

## Files

- `src/components/home-preview.tsx` — composer, navigation, fixture states, preview and theme control.
- `src/components/home-workspace.css` — scoped responsive and accessibility adjustments.
- `src/app/learn/page.tsx` — server-side mode boundary and minimal fixture projection.
- `src/lib/home/preparation-draft.ts` — transient browser-only navigation handoff, shared with T05.
- `tests/browser/home.spec.ts` — four scenarios, each configured for desktop and 360px phone.

## Verification

Targeted zero-warning ESLint and Prettier passed for the changed home modules and browser checks. `git diff --check` passed for the tracked home changes. Current Context7 Next.js documentation and installed Next.js client/server and navigation guides were consulted before implementation.

The coordinating agent runs the integrated browser suite and production/type checks from an isolated verification checkout because a separate landing-page task is changing the shared working directory. The browser scenarios cover two fixture lessons, input retention, theme/width, sidebar/skip/example focus, empty/pending fixture states, enlarged text, reduced motion, a long unbroken title, whitespace rejection, private handoff to preparation, refresh loss of an unsaved draft and Add material navigation. Final execution results belong in `docs/SETUP_STATUS.md`.

## Remaining boundaries

No credentials are required for T06 fixture UI. Real identity, live preparation persistence and hosted verification use T02/T05 configuration; T06 does not certify them. Class joining and published class lessons belong to T13/T14; starting/resuming teaching sessions and assessment belong to later tasks. The lesson pack still needs human teacher/lead approval. No real pupil data, model request, paid call, Docker operation, push or deployment is part of this task.
