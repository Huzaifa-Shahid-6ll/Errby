# Screens and essential states
| Route / view | Main task | Essential states |
| --- | --- | --- |
| / | Start a lesson; resume or choose a class lesson | New account, returning learner, no class, preparation in progress |
| /setup | Minimal role/grade/access setup | Student, teacher, assisted younger learner, retained composer input |
| /join | Join class | Valid, invalid, expired, already joined, limited attempts |
| /prepare/:id | Review scope and answer clarification | Extracting, questions, draft ready, ambiguous, failed, cancelled |
| /lessons/:id | Open selected published lesson | Available, draft forbidden, archived, access denied |
| /sessions/:id | Teach Errby | Awaiting explanation, checking, Errby reply, supervisor correction, uncertainty, paused |
| /sessions/:id/results | Review session evidence | Complete, partial, waiting review, no scorable answer |
| /teacher/classes | Create/select class | Empty, populated, form error |
| /teacher/classes/:id | Roster and lesson list | No members, no published lesson, selected lesson, summary loading |
| /teacher/classes/:id/materials | Add sources; map/edit/publish lessons | Upload, extraction preview, draft list, flagged content, published |
| /teacher/classes/:id/students/:id | Inspect lesson evidence | Untested, developing, explained, unverified, revised assessment |
| /settings | Account, data and accessibility controls | Theme if supported, reduced motion, delete confirmation, recovery |

## Home
Slim sidebar; central composer above the fold. Clear heading: “What are you teaching Errby today?” Typed topic or link input, Add material and Prepare lesson. Secondary school lesson list and Resume. No sales hero, motivational quote carousel, unnecessary usage cards or microphone.

## Session
Persistent lesson title; objective progress visible but quiet. Conversation is the main column. Errby has a robot marker and lavender identity; learner neutral; Supervisor has amber edge, shield icon and explicit label. On desktop show compact objective list to the right. On mobile put goals in an accessible disclosure. Keep composer above virtual keyboard without covering the last response.

## Results
Show actual denominators: “3 of 4 goals explained”, not a full success state if one is unverified. Accuracy card opens its definition. Active time is a neutral metric. Corrections are a positive learning record, not shame. One specific next step replaces multiple competing CTAs.

## Teacher roster
Each row/card shows alias, current lesson, one-word status, compact objective evidence and last activity. Status alone cannot describe what the learner knows; pair it with a topic label such as “Heat transfer — Explained”. Details state the latest session scope and limitations.

## Accessible behaviour
Focus returns to appropriate input after errors; new messages announced politely, not every streamed token. Role differences use labels and icons as well as colour. Keyboard navigation, 200% text, reduced motion and 360px widths are required. Touch targets should be comfortably usable, aiming for 44px. Contrast must be checked against actual final colours.
