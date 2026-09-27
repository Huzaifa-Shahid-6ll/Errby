# T19 teacher walkthrough and pilot record

Status: **prepared, not conducted** (27 September 2026). No teacher, adult tester, school or pupil has taken part; there are no observations, approvals or pilot results to report. Use synthetic accounts and material without personal data. T18's 68 local browser cases now pass, including tablet/200% checks; API-mocked session and publication checks do not verify hosted integration. Actual screen-reader review, hosted acceptance, human lesson review and observed model-evaluation acceptance remain open. A walkthrough cannot close those gates by itself.

## Before inviting a participant

1. A facilitator confirms the tested build and URL, records its commit and date, verifies a non-local synthetic Supabase project with two isolated classes, and prepares approved teacher and adult learner accounts. Keep join codes private. Do not use a shared judge account or real school roster.
2. A teacher reviews a short source, objective, reference and correction criteria before publication. Mark fictional or unreviewed examples as such; illustrative fixtures cannot be published. Confirm durable budget reservations and caps before enabling authorised paid requests. Never present authored replies or a fixture as observed grading. Private learner practice stays visibly AI-generated and not teacher reviewed.
3. Check the actual device/browser at 360×800, 768×1024 and 1366×768, including 200% text, keyboard and a screen reader available to the participant. Log failed checks as defects. Confirm results and private sessions are scoped; test class crossing with separate synthetic accounts before a live walkthrough.
4. Tell the adult participant the purpose, approximate duration (20–30 minutes), synthetic data rule and what notes will be kept. Obtain permission before quoting or recording. Use anonymous participant IDs in notes; do not record raw chat, credentials, join codes, names or screenshots containing identifiers. Participation can stop at any time.

If hosted identity or an approved lesson is unavailable, run only a clearly labelled **interface preview** with local fictional fixtures. Record which tasks cannot be attempted; do not describe it as an end-to-end school path.

## Facilitator script

Give one task at a time. Ask the participant to think aloud without steering. Record the first unaided attempt, any hint, error, recovery and elapsed time. A hint changes the outcome to _assisted_; do not count it as unaided success. Use invented topics and answers.

| Step                       | Prompt to participant                                                                                                                                   | Observe and record                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teacher setup              | “Create a synthetic class, add short learning material with no personal data, review the generated draft against its source and publish it when ready.” | Findability of `/classes` and `/prepare`, source/reference understanding, review blockers, keyboard access, time to publish. If publication is unavailable, stop and record why.                  |
| Learner entry              | “Using this synthetic account, join that class and start its lesson.”                                                                                   | Code preview/confirmation, correct class and lesson, genuine opening question, phone and tablet layout.                                                                                           |
| Teach and role distinction | “Explain one concept in your own words. Tell me which messages are from Errby and which are from Supervisor.”                                           | Role distinction without relying on colour, clarity of feedback, whether the participant sees any unsupported grading claim. Record the actual provider response or failure; do not stage a pass. |
| Recovery                   | “Pause or leave, return, and find your conversation and any unsent draft.”                                                                              | Saved answer versus draft distinction, retry behaviour, resumption, focus and screen-reader announcements.                                                                                        |
| Feedback                   | “Find your result and explain what it says. As teacher, find this learner's class result.”                                                              | Unverified/partial labels, unmeasured metrics, teacher scope, no private transcript or other-class information. Do not infer learning improvement from a UI label.                                |
| Stress/access              | Repeat the hardest step with keyboard only, 200% text, long title/answer and preferred screen reader; try phone, tablet and laptop widths.              | Overflow, focus order, spoken roles/status, readability, latency from action to useful response. Report median and slow cases only from measured runs.                                            |

The facilitator may explain product intent **after** each unaided attempt. Do not ask leading questions such as “Was the Supervisor clear?” Ask “Who spoke here, and what would you do next?” End with: “What confused you, what helped, and what would you change first?”

## Hackathon presentation rehearsal

This is a presenter-led technical demonstration, separate from the unaided human walkthrough above. Use only a build with recorded checks and synthetic accounts. Do not promise completion within a fixed time or preannounce an AI verdict.

1. Open `/learn` and identify the signed-in role. Briefly explain: the learner teaches Errby; Supervisor provides grounded correction; only valid evidence advances required objectives.
2. In a teacher account, open `/classes`, create the synthetic class, copy its private code, and open `/prepare`. Select the class and add a short source. Show extraction and `Generate lesson draft`; review objectives, reference excerpts and misconception corrections. Save edits before approving, then confirm publication. This step needs an actual qualified human review; do not click approval merely to make a demo pass.
3. In a separate synthetic learner account, use `/classes` to check and confirm the code, then return to `/learn` and start the published lesson. Answer the actual opening question. Explain observed Errby/Supervisor messages, including any uncertainty. Completion is demonstrated only if every required objective has accepted independent evidence.
4. Pause the session, return to `/learn`, continue it and inspect `View results`. Show the teacher's class summary using the teacher account; private practice must not appear there. Explain that the results describe this interaction, not measured learning improvement.
5. If time allows, show the independent learner path: private source preparation, visibly unreviewed private practice, and saved-session resume. On a provider failure, show the saved answer and `Retry AI response`; never replace the failure with a fabricated success. End on the usable saved result or honest recovery state.

If hosted migration/Auth/provider gates are unresolved, present `/learn` in **Local demo** mode instead: open a fictional example, distinguish its role labels, then use `/prepare` for real synthetic text/PDF extraction. State plainly that this fallback has no saved account, grading or paid AI result. Avoid developer terminals containing keys, join codes or database URLs in the recording. See [the release checklist](T20_RELEASE.md) for the current technical gate record.

## Observation sheet — copy once per participant

| Field                                                                             | Record |
| --------------------------------------------------------------------------------- | ------ |
| Session ID, date, build/URL                                                       |        |
| Adult role, device, browser, viewport, assistive technology                       |        |
| Consent for anonymous notes / direct quote / recording (separate choices)         |        |
| Synthetic accounts and lesson IDs only (no credentials or code)                   |        |
| Steps attempted; unaided / assisted / blocked; time and observed wait             |        |
| Exact error state, reproduction steps and screenshot reference if permitted       |        |
| Participant's own feedback, marked paraphrase or consented quote                  |        |
| Facilitator interpretation, kept separate from observation                        |        |
| Security/privacy issue, accessibility issue, confusing claim or performance issue |        |
| Proposed change, owner, priority, verification and teacher review decision        |        |
| Tasks skipped and reason                                                          |        |

Keep the raw sheet in the team's access-controlled location, outside the repository. Publish only anonymous aggregate findings after checking consent and removing identifiers. A single adult walkthrough tests usability, not efficacy.

## Review and pilot decision

Triage observed defects with a teacher and lead. Block the next trial for false completion, unsupported correctness, exposed credentials or cross-class/private data, lost submitted answers, duplicate grading, inaccessible essential action, or an unusable school upload path. Reproduce each issue, make the smallest scoped fix, run the relevant regression and have the teacher review changed lesson claims. Record the before/after observation and actual test; do not close an item because a screenshot looks improved.

An actual pupil pilot requires school/teacher approval, local consent review for the known ages and jurisdiction, applicable provider child-data controls (including approved zero data retention where required), live budget caps, verified Auth/RLS/Storage and deletion, teacher-reviewed lesson content, and the critical defects above cleared. Free-form text can contain personal data even under aliases. No pupil data or model call is authorised by this document. If those gates are not met, use adult roleplay with synthetic data and label the result a walkthrough, not a pupil pilot.

## Outcome log

| Date/build                                    | Participants | Steps completed | Findings/changes                                                                                            | Evidence                                                        | Decision                                     |
| --------------------------------------------- | ------------ | --------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| 26 Sep 2026 / preparation only                | 0            | 0               | Protocol prepared; no human findings                                                                        | This document; existing local T18 and feature checks            | Walkthrough and eligible pilot pending       |
| 27 Sep 2026 / technical rehearsal preparation | 0            | 0               | Updated script for generated private practice, saved-session recovery and teacher review; no human findings | T18 local 68-case browser run; API-mocked flows remain labelled | Human walkthrough and eligible pilot pending |
