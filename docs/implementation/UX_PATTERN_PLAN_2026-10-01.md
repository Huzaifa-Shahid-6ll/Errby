# Applying conversational UI research to Errby

## Follow-up delivery: all 25 patterns

The user authorized the remaining items below after the initial plan. All 25 now have an implemented or preserved application; the earlier table and sequencing are the historical first-pass plan. [Setup status](../SETUP_STATUS.md) records verification separately from implementation.

- **07 — Stop processing:** request cancellation reaches preparation and provider work. Existing saved work may already have committed; dispatched calls may incur charges. Drafts and retry identities remain, with explicit refresh/retry recovery.
- **13 — Search:** owner-scoped RLS queries search saved private session titles and message text with pagination beyond 20 entries. Tab-only opening chat is outside saved search.
- **14–16 — Documents:** originals save privately in Supabase Storage with owner metadata/extraction in Postgres. Saved documents can be previewed, downloaded and removed. Full-document selection uses server-stored extraction; editing switches to an excerpt without page claims. Limits: 4 MiB/file, 20 originals/account, bounded extraction, 8,000-character editable excerpts.
- **17–18 — Sources:** an existing Radix Dialog shows exact lesson reference excerpts, available page/section locations and owner-authorized original downloads. Removing an original retains excerpts already used in saved practice.
- **22 — Simpler wording:** a dedicated endpoint rewords the current question without recording a learner answer or invoking assessment. Access and sequence are checked before and after; correction facts are excluded.
- **25 — Accessibility:** shared Dialog animations now also obey system reduced motion and the existing manual pause preference. New surfaces reuse existing shadcn-style Buttons/Inputs and Animate UI Radix Dialogs.

Two curated source-backed starters offer heat-transfer and equivalent-fractions notes with attribution and short verified quotations. Explicit selection preserves existing drafts. This is finite source coverage, not automatic verification of arbitrary topics. The Supervisor, all-required-objectives rule and uncertainty/copy safeguards remain authoritative. Teacher/class/publication screens remain excluded.

The bounded, owner-keyed extraction cache and successful model replay avoid duplicate work. Authentication, private HTTP responses and progress remain uncached. Account deletion removes originals first; interrupted uploads have explicit operator reconciliation. [Storage/caching](STORAGE_AND_CACHING.md) and [cancellation](GENERATION_CANCELLATION.md) document these contracts.

No new UI/cache framework was added. Next and its ESLint configuration were patched to 16.3.8 to address the pre-existing critical advisory. The user authorized at most US$1 for synthetic live AI tests; no real pupil data, Docker, commit, push or deployment is part of this delivery.

## Historical first-pass plan

1 October 2026. Prepared by the separate UX planning/implementation agent requested by the user. Scope: the learner teaches Errby in a private conversation; the Supervisor remains part of the learning engine. Teacher/class workflows stay retired.

## Decision and original-vision fit

Keep the current chat engine, source-grounded evaluator, immutable lessons, spending reservations and stored evidence. Borrow interaction patterns from ChatGPT and Claude where they help a learner explain, recover and understand what was saved. Do not turn Errby into a general answer generator or add projects, autonomous agents, image generation, voice, teacher dashboards or public sharing.

Read `SETUP_STATUS.md` first, then `CHAT_FIRST_PLAN.md`, the product brief, learning-design specification and current colour guide. The user's later chat-first decision supersedes the original school/teacher journey and separate visible Supervisor. Indigo/neutral surfaces remain authoritative; the current quiet workspace carries Supervisor corrections through Errby while retaining their stored role. A supplied correction still cannot earn learner credit.

## Actual gaps found before implementation

The existing app already has immediate chat entry, Enter/Shift+Enter with IME protection, streamed ungraded replies, real processing states, bounded retry identities, reviewed upload excerpts, private saved sessions, draft recovery, themes and reduced-motion controls. Reimplementing these would add risk without value.

The audit found four concrete navigation/interaction gaps: no copy action; no follow/jump control in saved sessions; the opening chat's latest button was itself below the long transcript; and an existing evidence/results route was undiscoverable from the conversation. Document preview did not explain storage before accepting the excerpt. A needs-review session had no teacher-free next step. These became the bounded first patch.

## All 25 patterns and application decisions

IDs match the [companion ChatGPT/Claude research report](../research/CHATGPT_CLAUDE_UX_2026-10-01.md). “Existing” means present in inspected code, not newly proven hosted behavior. “Implemented” describes this local patch; final verification is recorded in setup status.

| ID  | Pattern                               | Errby application and acceptance                                                                                                                                                     | Delivery                                                              |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 01  | Immediate chat entry                  | `/learn` opens the composer without a teacher, class or preparation wizard; no model request on page load.                                                                           | Existing; preserve                                                    |
| 02  | One conversation spine                | Keep opening conversation alongside source-grounded practice in the same workspace.                                                                                                  | Existing; preserve                                                    |
| 03  | Disclose secondary composer actions   | Attach and Paste notes stay local to the composer; avoid extra screens or a tool marketplace.                                                                                        | Existing; preserve                                                    |
| 04  | Editable multiline drafts             | Enter sends, Shift+Enter adds a line, composing characters do not submit, and errors retain text.                                                                                    | Existing; preserve                                                    |
| 05  | Real incremental streaming            | Stream ungraded opening text; expose assessed replies only after durable validation.                                                                                                 | Existing; preserve                                                    |
| 06  | Honest processing stages              | Upload percentage and actual extraction, preparation, saving and checking stages; no invented progress or chain-of-thought.                                                          | Existing; preserve                                                    |
| 07  | Stop/cancel semantics                 | Existing attachment cancellation is honest. Model-stop needs a durable cancellation/recovery contract before adding a button that implies paid server work stopped.                  | Upload existing; reply stop deferred                                  |
| 08  | Retry without duplicate work          | Retain request keys and provider reservations; do not implement regenerate-as-a-new-paid-request by default.                                                                         | Existing; preserve                                                    |
| 09  | Follow latest without stealing scroll | Reuse one control for both transcripts; retain reading position above latest and offer a visible keyboard/touch jump. Status focus must not yank the viewport.                       | Implemented                                                           |
| 10  | Contextual message actions            | Copy finalized message text exactly with success/failure feedback. Do not copy partial streams into assessed history or offer history rewriting.                                     | Implemented                                                           |
| 11  | Readable semantic text                | Preserve escaped multiline text, readable width, wrapping and role labels. No raw HTML/Markdown renderer dependency needed for the present prose contract.                           | Existing; preserve                                                    |
| 12  | Private recent conversations          | Reuse owner-filtered sidebar/mobile history and visible current selection.                                                                                                           | Existing; preserve                                                    |
| 13  | Search existing history               | A real search must query owner-scoped durable history, including older sessions; filtering only the current 20 items must not claim full search.                                     | Follow-up when larger histories justify it                            |
| 14  | Saved versus tab-only clarity         | Opening conversation and unsent drafts remain explicitly tab-local; selected source text saves only on Send; original files are discarded.                                           | Existing, preview disclosure improved                                 |
| 15  | Inspect attachments before use        | Coverage, warnings, preview and explicit replace/use action leave drafts untouched until chosen.                                                                                     | Existing; preserve                                                    |
| 16  | Extraction coverage and limits        | Keep 4 MiB admission, missing-page warnings, 8,000-character excerpt disclosure and unreviewed status. Cache disclosure does not imply Storage upload.                               | Existing, cache/storage disclosure added                              |
| 17  | Inspect grounded evidence on demand   | Expose existing results evidence from the session. Exact document-page provenance needs structured ingestion changes; plain pasted page markers are not citations.                   | Evidence navigation implemented; structured source citation follow-up |
| 18  | Secondary detail surface              | Existing results page suffices for evidence; return goes to the same quiet conversation. Add a side panel only if usability shows navigation disrupts explanations.                  | Existing page reused; return fixed                                    |
| 19  | Conversation-local scope              | Retain bounded context and private immutable lesson source. Do not add global pupil memory or share cached extracted text between users.                                             | Existing; preserve; cache audited separately                          |
| 20  | Draft recovery and continuity         | Keep tab/session-scoped drafts and pending retry identity; clipboard/navigation controls must not mutate them.                                                                       | Existing; regression checked                                          |
| 21  | Actionable limits and errors          | Keep unsupported uploads/retries honest. Unresolved sessions offer a return to chat with clearer notes while retaining the old unresolved record and any opening draft.              | Recovery guidance implemented                                         |
| 22  | Simpler wording in context            | The original learning design permits requests for simpler wording without penalty. A dedicated shortcut must wait until the evaluator separates help requests from scorable answers. | Plan only; no misleading shortcut                                     |
| 23  | Quiet, grounded Supervisor correction | Preserve real stored Supervisor role, source checking and correction-copy protection. Guidance remains visible through Errby; no teacher step.                                       | Existing; backend audit/fixes owned separately                        |
| 24  | Evidence-backed recap                 | Link to existing required-goal evidence, unresolved states and honest insufficient-evidence metrics. Never infer completion from message count or a model's claim.                   | Navigation implemented                                                |
| 25  | Accessible responsive preferences     | Keep themes, motion pause, system reduced motion, labels, focus and 44px controls; test both desktop and phone.                                                                      | Existing plus accessible new controls                                 |

## Implementation sequence and acceptance

1. **Conversation controls (this patch):** one small client module used by opening and saved transcripts. Exact-copy succeeds or reports denial; latest stays reachable while reading earlier text; jumping and copying preserve drafts. No backend import crosses the client boundary. Installed Next 16.3.5 server/client guide and Context7 `/vercel/next.js` informed the boundary.
2. **Evidence and recovery (this patch):** reveal the existing results route, preserve quiet chat on return, explain upload storage before using notes, and offer a return to chat to prepare clearer notes without changing the unresolved verdict or discarding opening drafts.
3. **Supervisor and caching (parallel owners):** verify original evidence/completion invariants and implement only bounded, owner-scoped extraction reuse. Independent correctness tests must prove owner isolation and invalidation; UX benefits never override authorization or unresolved evidence. See the final setup-status entry for actual changes and verification.
4. **Later only with explicit product need:** full saved-history search, structured document citations, a detail side panel, true generation cancellation and evaluator-aware simpler-wording actions. These are sequenced follow-ups, not delivered features. Preserve existing caps and no automatic paid retry.

## Verification and limits

`tests/browser/chat-controls.spec.ts` adds two mocked scenarios, each run on desktop and phone, covering exact multiline copy, denied clipboard, reachable latest navigation, draft retention, quiet Supervisor display and evidence-route discovery. Existing entry/session tests cover streaming, retries, keyboard handling, upload warnings and failure recovery. Parent runs the final production build and combined browser suite to avoid concurrent Next output conflicts.

The evidence record is `docs/SETUP_STATUS.md`. Browser mocks do not establish hosted persistence, actual clipboard permissions on every browser, screen-reader speech, paid-provider performance or live Supabase Storage. The UI patch introduces no dependency, schema migration, model request, teacher screen, commit or deployment.

Final integration: `npm run check`, production build, traced document-parser packaging and all 58 desktop/phone browser checks passed. T3 DOM checks confirmed the phone controls/draft without overflow; screenshot capture failed, so no screenshot-based visual acceptance is claimed. The full evidence and remaining hosted/provider limits are recorded in setup status.
