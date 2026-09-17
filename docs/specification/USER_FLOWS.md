# User flows
## First independent lesson
Home exposes topic composer immediately. Learner enters a topic/material; access setup collects only necessary age band/grade and identity context. For a younger pilot learner use the approved school/guardian setup route. Preserve the topic across sign-in. Ask missing context in one small panel, not a long onboarding survey.

Preparation shows actual states: reading material, clarifying scope, preparing lesson, needs review, ready, failed. No invented percentage or artificial wait. Show a compact scope preview with title, level and objectives; allow edit. The first question appears as soon as the prepared lesson is valid.

## Teacher creates a class
Teacher signs in → class name and grade band → add material or topic list → answer missing subject/level questions → see draft lesson list → open flagged/generated lessons → edit or approve → publish selected lessons → share class code.
English is preselected, not asked. Syllabus outline alone starts the flow. Review is a functional content check with reference/uncertainty labels, not a decorative approval button.

## Student joins school
Teacher/guardian-assisted student setup when needed → student signs in → enters class code → server validates code and membership → sees class and teacher display name → confirms join → school lesson list appears. Use class-scoped aliases; do not expose other pupils' accounts during join. Invalid/rotated codes do not disclose a roster.

## Teaching loop
Prepared lesson → Errby asks genuine open question → student submits → server records submission and runs evaluator.
- Correct: record evidence, then ask a follow-up or introduce an approved misconception.
- Partial: ask a targeted clarification without calling the learner wrong.
- Incorrect, or agrees with Errby's misconception: supervisor explains the specific issue; student must re-explain it.
- Unverified/conflicting: supervisor states uncertainty and creates a review item. That objective remains unresolved.
After a correction, test application with a changed example rather than copying back a sentence.

## Completion and exit
All required goals demonstrate the configured evidence criteria → completed summary. Otherwise learner can pause/end with an incomplete summary. Never trap a learner in an endless chat. After repeated unresolved attempts, offer a hint, explanation and save-for-later; do not fabricate completion.
Teacher edits to live lesson content create a new version; current sessions keep their original objective set.

## Failure recovery
Input remains after preparation failure. Upload can be removed without losing typed topic. Server timeout shows saved answer with a retry action. Offline submission retains draft locally only as temporary recovery; successful persistence clears that local draft. Double submit uses one idempotency key. Session ownership errors show a neutral access message. Deleted/archived school lessons do not expose private content through old links.

## Teacher review after a session
Class roster → select lesson → read topic-specific statuses → open a student's objective breakdown → see supporting short excerpts and uncertainty reasons → review flagged claims. A teacher override creates an audited assessment revision and recomputes summary. It does not silently rewrite original model evidence.
