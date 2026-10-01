# ChatGPT and Claude web UX: 25 patterns for Errby

Research date: 1 October 2026. Scope: independent learners, chat, document context, generation feedback, recovery and evidence-based practice. Teacher dashboards, classes, publishing and teacher review are excluded.

This is a source-based product review plus a repository review, not an authenticated walkthrough of either competitor. Official help pages were searched and opened during this task. No competitor generation was purchased or run; no response speed, accessibility conformance or educational outcome was measured. “Documented” below means the cited help page describes the behavior. “Adaptation” means a design recommendation for Errby; it does not claim either competitor implements the exact behavior. Sources describe rolling products and sometimes disagree across experiences, so exact placements and availability are not treated as universal.

The strongest transferable idea is a dependable conversation: start immediately, make context inspectable, show real work, preserve the learner's effort, and explain recovery. Errby should remain an AI learner the student teaches. Its Supervisor must check evidence on the server and deliver necessary corrections through Errby, as required by the current [chat-first plan](../implementation/CHAT_FIRST_PLAN.md).

## What the current app already has

Reviewed `docs/SETUP_STATUS.md` first, then `CHAT_FIRST_PLAN.md`, `PRODUCT_BRIEF.md`, `LEARNING_DESIGN.md`, `AI_SPEC.md`, `src/app/learn/page.tsx`, `chat-entry.tsx`, `chat-workspace.css`, the saved `session-view.tsx`, `src/lib/chat/entry.ts`, and the chat attachment route. This baseline precedes other agents' changes in this task; final delivery and verification belong in setup status.

- `/learn` already opens a conversation without a planning wizard. A topic-only opening is ungraded and retained in the current browser tab. The provider receives bounded recent context, not all visible opening history.
- Notes run private preparation and open the existing durable lesson/session engine. Recent history reads the 20 newest private sessions. There is no history search in the reviewed baseline.
- Ungraded opening text already streams real provider deltas. Assessed replies wait for evidence validation and durable processing. Real preparation stages, retry identity and saved-session recovery already exist.
- PDF/DOCX uploads already have a 4 MiB limit, progress, cancellation, extraction warnings and a preview. At baseline, original file bytes are not saved by the chat attachment route. The learner can place at most the first 8,000 extracted characters into an editable notes draft. Sending notes persists the accepted text through private preparation; upload alone does not create a durable original-file library.
- The quiet saved-session view renders Supervisor messages through Errby while retaining the stored role. It hides objective panels. The evaluator, copied-correction defenses, evidence rules and server completion remain the authority.
- Theme selection, reduced-motion handling, animation pause, native controls and responsive layouts already exist. Recent effects are presentation, not proof of model activity or grading.

## Product comparison and interpretation

| Area                   | Documented ChatGPT behavior                                                                                                                                                             | Documented Claude behavior                                                                                                                                                                               | Errby implication                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Entry                  | Natural-language conversation with tools available in context. [Capabilities](https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview)                                | The new chat/Cowork experience combines tasks in one conversation, with staged availability. [Unified experience](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude) | Preserve one teaching conversation; do not introduce mode or setup decisions before typing.                         |
| Control                | Stop/regenerate recovery is documented. [Troubleshooting](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages)                                           | The unified experience permits stopping or redirecting work. [Unified experience](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude)                                 | State exactly what stops: uploading, display, processing or the session. These are different actions.               |
| Reusable context       | Projects group chats, files and instructions. [Projects](https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt)                                                        | Files can belong to an individual chat or project context. [Uploads](https://support.claude.com/en/articles/8241126-upload-files-to-claude)                                                              | Reuse private source context only inside its authorized scope. Do not add a project product to obtain this benefit. |
| Durable output         | Canvas separates work on an output from the conversation. [Capabilities](https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview)                                     | Artifacts open beside the conversation. [Artifacts](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them)                                                            | An optional source or learning recap disclosure is sufficient; no code execution or artifact builder is needed.     |
| Recovery and discovery | Search can recover old conversations that are absent from the sidebar. [Finding content](https://help.openai.com/en/articles/10056348-finding-your-chats-projects-and-files-in-chatgpt) | Recents combines conversations in the unified experience. [Unified experience](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude)                                    | Recent history should be clearly bounded; missing from the list must not imply deletion.                            |

Two current-document cautions matter. Claude's unified-experience page says branching from an earlier point is unavailable, while its artifacts page describes editing earlier messages into another version. These are not evidence of one universal branching UI. Similarly, current Claude personalization documentation discusses instructions and skills; an old “Styles” menu is not a safe implementation reference. Errby does not need either feature to improve this teaching loop. [Unified experience](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude), [Artifacts](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them), [Personalization](https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features).

## Exactly 25 applicable patterns

Priority definitions: **P0** protects learning, privacy, recovery or basic usability; **P1** improves the everyday interaction; **P2** is a conditional extension after the simpler workflow is verified. A priority does not mean the pattern is missing: “retain” is a valid implementation decision.

### 01. Immediate chat entry — P0, retain

**Evidence:** ChatGPT documents natural-language interaction; Claude's new experience removes an up-front chat/Cowork choice. [ChatGPT capabilities](https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview), [Claude unified experience](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude).

**Errby adaptation:** Keep `/learn` focused on “What would you like to teach me?” A greeting or topic should work immediately, without a teacher, class, document or model selection. Optional examples should fill a draft and never spend money automatically.

**Acceptance:** A newly authenticated learner can type and send in the first screen. Page load makes no AI call. A topic starts an honest ungraded exchange and does not manufacture reference evidence.

### 02. One visible conversation, with complexity behind it — P1, retain

**Evidence:** Claude documents quick questions and longer work in the same conversation. ChatGPT documents contextual follow-up across turns. [Claude unified experience](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude), [ChatGPT capabilities](https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview).

**Errby adaptation:** Maintain one chronological learner/Errby thread across the opening-to-practice handoff. Preparation and supervision should be server responsibilities, not extra learner-facing dashboards.

**Acceptance:** Importing notes does not lose the local opening or unsent draft. The interface identifies any local-only portion accurately. Stored Supervisor roles remain intact even though the visible identity is Errby.

### 03. Put secondary capabilities beside the composer — P1, retain

**Evidence:** Claude documents file attachment through the plus control; ChatGPT documents tool selection from the composer. [Claude uploads](https://support.claude.com/en/articles/8241126-upload-files-to-claude), [ChatGPT search](https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt).

**Errby adaptation:** Keep Attach and Notes beside the text field, visibly labeled. Two controls do not justify a command palette or nested menu. Additional tools should appear only if they exist and serve teaching.

**Acceptance:** Keyboard and touch users can discover both controls; selected Notes mode is visible and announced. No voice, search or image-generation control implies an unavailable capability.

### 04. Treat the draft as editable learner work — P1, strengthen

**Evidence:** ChatGPT release notes describe formatted pasted text remaining usable while composing. This supports a compose-before-send workflow; the exact keyboard behavior below is an Errby recommendation. [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes).

**Errby adaptation:** Preserve multiline drafts and native selection. Show a clear character limit. If Enter sends, Shift+Enter inserts a line break and IME composition must never accidentally submit. Keep a visible Send button.

**Acceptance:** Paste, edit, line breaks, keyboard composition and failed submission preserve exact learner wording. Uploaded notes do not silently overwrite an existing draft. Submitted assessed messages are immutable evidence; editing the next draft is not editing past evidence.

### 05. Reveal real generated text incrementally — P0, retain

**Evidence:** ChatGPT help distinguishes active generation from completed or failed responses. Incremental display is a proposed Errby latency treatment; these help pages do not establish competitor token cadence, transport or buffering. [ChatGPT troubleshooting](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages).

**Errby adaptation:** Keep existing real streaming for ungraded opening replies. Render deltas as plain text without fake typewriter delays. For assessed turns, stream safe stage messages and release reply content only after validation/persistence; do not stream an unvalidated misconception or verdict.

**Acceptance:** A delayed mock stream visibly grows before completion. Broken or truncated streams do not enter durable history or award progress. Screen readers receive useful completion/status feedback without being forced through every token.

### 06. Explain processing with actual stages — P0, retain

**Evidence:** ChatGPT deep research documents progress visibility and the ability to adjust work while it runs. [Deep research](https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt).

**Errby adaptation:** Reuse real events such as uploading, extracting text, preparing a question, checking reference coverage and saving. A quiet orb may accompany status text. Do not present simulated reasoning, invented tool calls or an unsupported percentage of “understanding.”

**Acceptance:** Every status corresponds to an actual operation or server state. Upload bytes and extraction are separate phases; 100% upload does not mean extraction finished. Animation pause leaves the status readable.

### 07. Give stop and cancel precise meanings — P0, gap to close carefully

**Evidence:** ChatGPT documents stopping generation; Claude documents stopping ongoing work. Neither source establishes Errby's billing or transaction semantics. [ChatGPT troubleshooting](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages), [Claude unified experience](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude).

**Errby adaptation:** Retain upload cancellation. If adding a reply stop control, say “Stop viewing reply” where only the browser reader stops; dispatched provider work and its reservation may continue. Pause session is a distinct durable action. Never let a UI cancellation discard a saved learner turn.

**Acceptance:** Cancellation preserves the draft and never falsely reports refunded cost, cancelled server work or lesson completion. Reopening a saved session shows its actual server state.

### 08. Retry recovery without duplicating the learner's action — P0, retain

**Evidence:** ChatGPT provides response regeneration as recovery from generation failures. Reusing an idempotent request instead of buying an alternate answer is Errby's adaptation. [ChatGPT troubleshooting](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages).

**Errby adaptation:** Preserve the existing retry key for the same payload/sequence. Resolve uncertain saved work before dispatching more work. Distinguish retrying a send from retrying processing of an already saved answer.

**Acceptance:** A lost response followed by retry produces one learner turn and one settled provider request. Edited text gets an appropriate new attempt without bypassing sequence checks. There is no “keep regenerating until I pass” path.

### 09. Follow new text without taking away reading control — P1, extend consistently

**Evidence:** ChatGPT separates historical retrieval from the active conversation. Scroll-follow behavior is a usability inference, not a verified competitor implementation. [Finding content](https://help.openai.com/en/articles/10056348-finding-your-chats-projects-and-files-in-chatgpt).

**Errby adaptation:** Retain opening-chat behavior that follows text near the bottom, then stops when the learner scrolls back. Offer an explicit Latest message control. Apply equivalent behavior to saved sessions if missing.

**Acceptance:** A growing reply does not pull a learner away from an earlier explanation. Latest message restores following deliberately. New messages do not steal keyboard focus; reduced-motion users get an immediate jump.

### 10. Place small actions on the relevant message — P1, bounded addition

**Evidence:** ChatGPT documents per-message menus for retaining responses in project context. The release notes also describe conversation-focused copying. [Projects](https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt), [Release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes).

**Errby adaptation:** Add a plain-text Copy action where useful, with local success/failure feedback. Keep it keyboard- and touch-accessible. Avoid a dense toolbar, rating system or assessed-message editing until there is a real product need.

**Acceptance:** Copy returns the intended message, excluding controls and status. Clipboard rejection is handled. Copying Supervisor guidance changes no evidence, and pasting that guidance cannot by itself earn credit.

### 11. Make generated prose readable before making it elaborate — P1, retain

**Evidence:** ChatGPT describes structured content handling; Claude provides chat-font appearance controls. The proposed line width and spacing are Errby design choices, not measured competitor values. [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes), [Claude appearance](https://support.claude.com/en/articles/8887527-customizing-your-appearance-settings).

**Errby adaptation:** Keep the existing restrained conversation width, preserved line breaks, readable line height and wrapping. Brief questions are the normal output. Plain text is adequate for the current learning contract; rich Markdown is conditional on actual content needs.

**Acceptance:** Long words and pasted notes do not overflow at 320px or 200% text. Model HTML remains inert. Student and Errby messages remain distinguishable without relying on color alone.

### 12. Keep private recent conversations easy to resume — P1, retain

**Evidence:** ChatGPT has a sidebar for existing content; Claude's unified experience consolidates conversations in Recents. [Finding content](https://help.openai.com/en/articles/10056348-finding-your-chats-projects-and-files-in-chatgpt), [Claude unified experience](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude).

**Errby adaptation:** Reuse the current private-session list and selected-chat styling. Prefer useful source/topic titles over more generated metadata. Provide a mobile disclosure with a clear account/new-chat path.

**Acceptance:** Opening a recent item resumes its real state without generating an answer on navigation. Another account cannot see titles, counts or messages from the first account. No teacher or class access path is reintroduced.

### 13. Distinguish recent-list filtering from full-history search — P2

**Evidence:** ChatGPT documents search across titles/messages and explains that older conversations can remain available outside its compact sidebar list. [Finding content](https://help.openai.com/en/articles/10056348-finding-your-chats-projects-and-files-in-chatgpt), [History search](https://help.openai.com/en/articles/10056348-how-do-i-search-my-chat-history-in-chatgpt).

**Errby adaptation:** A native filter of the current 20 items is a small first step, labeled “Filter recent chats.” Finding older sessions needs owner-scoped server search or pagination; do not label a client-only filter “Search all history.”

**Acceptance:** Empty results distinguish “no recent match” from “no saved sessions.” When server search is added, it searches only authorized private records and handles deleted sessions without reviving stale content.

### 14. State what is saved, temporary and remembered — P0, strengthen

**Evidence:** ChatGPT distinguishes chat retention, files and memory; Claude distinguishes incognito history from remembered context. These are separate concepts, not interchangeable labels. [Chat/file retention](https://help.openai.com/en/articles/8983778-chat-and-file-retention-in-chatgpt), [ChatGPT memory](https://help.openai.com/en/articles/8590148-memory-in-chatgpt), [Claude memory](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context).

**Errby adaptation:** Keep the opening-chat tab-only disclosure prominent enough to notice. Identify saved practice after handoff. “Private” describes access, not a promise that nothing leaves the browser or reaches the model provider.

**Acceptance:** Refresh, new tab, sign-out and saved-session reopening match the copy. Never call tab-local opening “incognito,” “zero retention” or “cross-device saved” without the underlying guarantee.

### 15. Make attached context inspectable before use — P0, retain

**Evidence:** Claude supports attachments within chats; ChatGPT Projects documents source preview and management. [Claude uploads](https://support.claude.com/en/articles/8241126-upload-files-to-claude), [ChatGPT Projects](https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt).

**Errby adaptation:** Preserve the filename, extraction preview, dismiss action and deliberate “use text” step. Keep the original draft until the learner chooses what to import. Name the import unreviewed reference notes.

**Acceptance:** Uploading alone cannot submit an explanation, start grading or overwrite the draft. Removing a preview removes its proposed context. The learner can inspect/edit exactly the text that will be submitted.

### 16. Expose document coverage and limits — P0, retain

**Evidence:** Both products document file-type and size limits; Claude distinguishes text-only extraction from supported visual PDF processing. [ChatGPT uploads](https://help.openai.com/en/articles/8555545-file-uploads-faq), [Claude uploads](https://support.claude.com/en/articles/8241126-upload-files-to-claude).

**Errby adaptation:** Keep Errby's own 4 MiB and 8,000-character boundaries rather than copying larger vendor allowances. Show missing pages, scan/image limitations and truncation explicitly. A successful upload is not proof the entire source was understood.

**Acceptance:** Scanned, unsupported, empty, too-large and partially extracted files produce actionable results. No “whole document reviewed” claim appears when only an excerpt is used. Page markers alone are not promoted into validated structured provenance.

### 17. Let learners inspect the source behind a claim — P0, incremental gap

**Evidence:** ChatGPT search and deep research link claims to sources; Claude memory can expose retrieved prior context as tool activity. [ChatGPT search](https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt), [Deep research](https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt), [Claude memory](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context).

**Errby adaptation:** Where the server has validated reference IDs/spans, offer a small “Reference notes” or “Why this correction?” disclosure. Start with existing safe projections. If the current projection cannot supply it, expose no invented citation; plan a narrow authorized projection first.

**Acceptance:** Opening evidence shows the actual authorized passage and its unreviewed status. Missing/conflicting evidence remains unverified. A citation cannot convert generated text or a learner's own answer into independent truth.

### 18. Separate inspectable material from the conversational turn — P2

**Evidence:** Claude artifacts open beside the conversation; ChatGPT describes Canvas as an adjacent editing workspace. [Claude artifacts](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them), [ChatGPT capabilities](https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview).

**Errby adaptation:** Use an optional disclosure or desktop side pane for reference text or the existing result recap. On a phone, a normal stacked section is sufficient. Reuse present content; no artifact runtime, sandbox or document editor is required.

**Acceptance:** Opening details preserves composer text and reading position. Closing returns focus to the trigger. The companion area cannot obscure a required correction or require horizontal scrolling.

### 19. Reuse context within a visible, private scope — P1, retain boundaries

**Evidence:** ChatGPT Projects and Claude project instructions provide context scoped to related work; both distinguish this from account-wide preferences. [ChatGPT Projects](https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt), [Claude personalization](https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features).

**Errby adaptation:** Reuse the existing immutable lesson/source version for its saved session. A new topic should not silently inherit another session's personal notes or “mastery.” Explain bounded opening context when a conversation outgrows it.

**Acceptance:** Changing source content creates the appropriate new version instead of rewriting prior evidence. Context cannot cross users. No global pupil-memory feature is needed to avoid asking for the same notes within one saved practice.

### 20. Preserve effort through navigation and uncertain requests — P0, retain and verify

**Evidence:** Both products document returning to ongoing or saved work. Draft autosave and request reconciliation below are Errby-specific adaptations, not a documented promise about competitor drafts. [ChatGPT Projects](https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt), [Claude unified experience](https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude).

**Errby adaptation:** Reuse account/session-scoped tab storage for drafts and retry identity; keep database session records authoritative. Storage denial should not disable typing. Reconcile uncertain submissions before inviting another one.

**Acceptance:** Reload restores the intended draft within the documented boundary. A saved answer and a newer unsent edit are distinguished. Sign-out/account switching never hydrates another learner's draft; failed storage writes do not destroy in-memory text.

### 21. Give each limit or error one useful next action — P0, strengthen

**Evidence:** ChatGPT and Claude document upload constraints and recovery guidance. [ChatGPT uploads](https://help.openai.com/en/articles/8555545-file-uploads-faq), [Claude uploads](https://support.claude.com/en/articles/8241126-upload-files-to-claude).

**Errby adaptation:** Explain what happened, whether the answer is saved, and whether to retry, refresh, paste a smaller excerpt, or wait. Translate budget limits into a clear blocked state. Do not repeatedly start paid work because the interface times out.

**Acceptance:** Authentication failure, foreign origin, upload limit, extraction failure, uncertain save, pending evaluation and provider cap all have truthful distinct copy. The learner's draft remains available; raw credentials or provider internals never appear.

### 22. Allow simpler wording without changing assessment standards — P1

**Evidence:** ChatGPT study mode documents asking for simpler language and one question at a time. Claude personalization distinguishes response preferences from task context. [ChatGPT study mode](https://help.openai.com/en/articles/11780217-using-study-mode-in-chatgpt), [Claude personalization](https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features).

**Errby adaptation:** Accept “ask that more simply” within the conversation; optionally add a draft-filling suggestion. Errby still asks the student to explain. A wording request must not become a scored answer or lower the objective's correctness criteria.

**Acceptance:** Simpler wording changes presentation only. No progress is awarded for pressing the action; the evaluator still accepts age-appropriate accurate paraphrases and ignores spelling as a correctness criterion.

### 23. Correct misunderstandings quietly but explicitly — P0, preserve original differentiator

**Evidence:** ChatGPT study mode documents open questions, feedback and checking understanding, while acknowledging possible mistakes. This supports a conversational correction pattern, not a guarantee of grading accuracy. [ChatGPT study mode](https://help.openai.com/en/articles/11780217-using-study-mode-in-chatgpt).

**Errby adaptation:** Preserve the existing Supervisor implementation. Errby can say it needs to correct something and ask for a changed example. Do not expose a teacher dashboard or separate Supervisor persona in the quiet workspace; do not hide the correction itself. Display uncertainty when sources cannot establish the answer.

**Acceptance:** False agreement triggers intervention before reinforcement; a correct correction is acknowledged; copied correction alone earns no credit; unresolved contradictions cannot complete the session. These are server-level checks, not cosmetic UI states.

### 24. End with an inspectable account of what was explained — P1, reuse existing results

**Evidence:** ChatGPT study mode documents checking understanding and suggesting review; Claude artifacts demonstrate separating reusable output from the running conversation. Neither source establishes Errby's completion predicate. [ChatGPT study mode](https://help.openai.com/en/articles/11780217-using-study-mode-in-chatgpt), [Claude artifacts](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them).

**Errby adaptation:** Reuse the persisted-evidence result page. Show explained concepts, what still needs work and the learner's supporting explanation where available. Keep this quiet and on demand; no score confetti, public rank or teacher report is needed.

**Acceptance:** The recap matches persisted objective states exactly. Paused/ended-incomplete sessions remain incomplete. Every required objective must have valid learner evidence with no unresolved contradiction before completion appears.

### 25. Preserve readable, responsive and calm controls — P0, retain and audit

**Evidence:** Claude documents light/system/dark appearance and a collapsible sidebar. The accessibility acceptance criteria below come from Errby's requirements, not an audited competitor conformance claim. [Claude appearance](https://support.claude.com/en/articles/8887527-customizing-your-appearance-settings).

**Errby adaptation:** Keep Errby's approved palette, visible focus, 44px actions, system reduced-motion support and persistent animation pause. Collapse navigation on phones without hiding New chat or account access. Prefer a static readable experience when GPU effects fail.

**Acceptance:** Keyboard-only use, 320px width, 200% text, dark mode, reduced motion, blocked WebGL and long text retain all essential actions. Labels and status survive without motion. Manual screen-reader testing is separate from DOM assertions and must not be claimed without being run.

## Text-generation interaction contract

The two Errby generation paths must feel like the same conversation while retaining different guarantees:

| Moment               | Opening conversation                                                          | Saved evidence-based practice                                                                 |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Submit               | Keep the exact draft and retry key until the response is confirmed.           | Save through the existing sequence/idempotency guard.                                         |
| Waiting              | Show connection/real generation state.                                        | Distinguish saved answer, evaluation, correction and next-question preparation.               |
| Content arrival      | Show actual plain-text deltas; no typewriter simulation.                      | Publish only content that passed the existing validation/persistence gates.                   |
| Reader stops viewing | Preserve draft/recovery identity; disclose that dispatched work may continue. | Stop local observation if supported; do not discard saved evidence or overwrite server state. |
| Failure              | Partial display is not a confirmed conversation turn.                         | A saved but unassessed answer stays pending and recoverable.                                  |
| Success              | Append the confirmed reply to tab-local history.                              | Render the durable server projection; completion only follows the server predicate.           |

These are implementation recommendations based on Errby's inspected code and invariants. The competitor sources do not expose their production transport, internal caches, billing settlement, moderation timing or database architecture. There is no basis here to copy those internals or assert token-per-second superiority.

## Document storage and cache implications

At the reviewed baseline, uploading a document means sending bytes to the server for extraction, receiving text/coverage, then explicitly choosing text for the draft. It does **not** mean the original PDF/DOCX has been saved in a Supabase Storage bucket. Submitted private notes are a different durable data path. Copy should say which of these occurred at the point it happens; the backend/storage audit supplies the authoritative table-level detail.

Original-file storage is a separate capability with ownership, retention, deletion and signed-access requirements. Do not imply it exists because Supabase is configured or because extracted text persists. Likewise, a local extraction cache is not a document library and provider response reuse is not cross-device chat history.

Caching should first reuse existing validated work: same-attempt provider responses, source/version preparation, immutable lesson context and bounded navigation data. Any new cache must define owner scope, content/version key, maximum size, expiry and invalidation. Authentication, authorization, spend reservations, mutable session state and the completion predicate must still be checked live at their trust boundaries. Never share model answers or extracted pupil notes across owners using only a content hash.

For read latency, measure duplicate reads and cold/warm request duration before claiming a speedup. For perceived latency, measure submit-to-status and submit-to-first-visible-text separately from submit-to-confirmed-answer. The existing local tests cannot establish hosted latency or actual provider cache savings.

## Implementation handoff and verification

The separate planner should map IDs 01–25 to retain, implement now, or a named dependency; it should not build 25 new features. Start with actual gaps around mobile new-chat access, local-versus-saved clarity, consistent latest-message behavior, bounded copy/compose improvements, and narrowly scoped safe caching. Stop/cancel, source inspection and history search require especially precise semantics and may need backend dependencies before UI controls can make promises.

Use the existing mock/provider/SQL/browser harness. Verify one representative path through greeting, notes import, genuine opening question, learner explanation, Supervisor correction, changed example, valid completion and recap. Add failure variants for partial stream, uncertain save, wrong owner, missing source, copied correction and budget exhaustion. Existing teacher routes remain retired. No real pupil data, paid model calls, hosted acceptance claim, commit, push or deployment is authorized by this research report.

A small fictional-data usability exercise can then observe time to first explanation, whether learners know what was saved, whether they can recover a failure, and whether they understand a correction. Record the participant count and failures; this does not demonstrate educational efficacy. Current research supports the design choices, while runnable application checks establish implementation behavior.
