# T19 teacher walkthrough and pilot record

Status: **prepared, not conducted** (26 September 2026). No teacher, adult tester, school or pupil has taken part; there are no observations, approvals or pilot results to report. Use this protocol only with fictional material and synthetic accounts. T18's tablet browser and screen-reader checks, hosted Auth/RLS checks, human lesson review and live evaluator integration remain open. A walkthrough cannot close those engineering gates by itself.

## Before inviting a participant

1. A facilitator confirms the tested build and URL, records its commit and date, verifies a non-local synthetic Supabase project with two isolated classes, and prepares approved teacher and adult learner accounts. Keep join codes private. Do not use a shared judge account or real school roster.
2. A teacher reviews a short source, objective, reference and correction criteria before publication. Mark any fictional or unreviewed example as such; do not publish it as reviewed. Confirm the application does not call a paid model and that budget reservations and caps exist before enabling one. Never present authored replies or a fixture as observed grading.
3. Check the actual device/browser at 360×800, 768×1024 and 1366×768, including 200% text, keyboard and a screen reader available to the participant. Log failed checks as defects. Confirm results and private sessions are scoped; test class crossing with separate synthetic accounts before a live walkthrough.
4. Tell the adult participant the purpose, approximate duration (20–30 minutes), synthetic data rule and what notes will be kept. Obtain permission before quoting or recording. Use anonymous participant IDs in notes; do not record raw chat, credentials, join codes, names or screenshots containing identifiers. Participation can stop at any time.

If hosted identity or an approved lesson is unavailable, run only a clearly labelled **interface preview** with local fictional fixtures. Record which tasks cannot be attempted; do not describe it as an end-to-end school path.

## Facilitator script

Give one task at a time. Ask the participant to think aloud without steering. Record the first unaided attempt, any hint, error, recovery and elapsed time. A hint changes the outcome to _assisted_; do not count it as unaided success. Use invented topics and answers.

| Step                       | Prompt to participant                                                                                                                      | Observe and record                                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teacher setup              | “Create a class, add short fictional material, make a source-backed objective, review it and publish it.”                                  | Findability of `/classes` and `/prepare`, source/reference understanding, review blockers, keyboard access, time to publish. If publication is unavailable, stop and record why.                            |
| Learner entry              | “Using this synthetic account, join that class and start its lesson.”                                                                      | Code preview/confirmation, correct class and lesson, genuine opening question, phone and tablet layout.                                                                                                     |
| Teach and role distinction | “Explain one concept in your own words. Tell me which messages are from Errby and which are from Supervisor.”                              | Role distinction without relying on colour, clarity of feedback, whether the participant sees any unsupported grading claim. The present evaluator may be disabled; record that state, do not stage a pass. |
| Recovery                   | “Pause or leave, return, and find your conversation and any unsent draft.”                                                                 | Saved answer versus draft distinction, retry behaviour, resumption, focus and screen-reader announcements.                                                                                                  |
| Feedback                   | “Find your result and explain what it says. As teacher, find this learner's class result.”                                                 | Unverified/partial labels, unmeasured metrics, teacher scope, no private transcript or other-class information. Do not infer learning improvement from a UI label.                                          |
| Stress/access              | Repeat the hardest step with keyboard only, 200% text, long title/answer and preferred screen reader; try phone, tablet and laptop widths. | Overflow, focus order, spoken roles/status, readability, latency from action to useful response. Report median and slow cases only from measured runs.                                                      |

The facilitator may explain product intent **after** each unaided attempt. Do not ask leading questions such as “Was the Supervisor clear?” Ask “Who spoke here, and what would you do next?” End with: “What confused you, what helped, and what would you change first?”

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

| Date/build                     | Participants | Steps completed | Findings/changes                     | Evidence                                             | Decision                               |
| ------------------------------ | ------------ | --------------- | ------------------------------------ | ---------------------------------------------------- | -------------------------------------- |
| 26 Sep 2026 / preparation only | 0            | 0               | Protocol prepared; no human findings | This document; existing local T18 and feature checks | Walkthrough and eligible pilot pending |
