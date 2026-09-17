# Analytics and evidence definitions
The requested Duolingo-inspired presentation means understandable progress and a satisfying recap. It does not authorise invented scores, public comparison, streak pressure or speed-based grading.

## Canonical events
session_started, question_shown, response_submitted, evaluation_recorded, supervisor_shown, correction_reexplained, objective_state_changed, session_paused, session_completed, source_flagged, teacher_reviewed.
Attach session/lesson-version/objective IDs, deduplicated turn ID, timestamps and small permitted metadata. Never send raw chat or class codes to third-party analytics.

## Metrics
| Label | Definition | Caveat |
| --- | --- | --- |
| Goals explained | Count of required goals with valid explained state / all required goals in fixed lesson version | Core completion metric; corrections can lead to success |
| First-try accuracy | First independent correct objective attempts / first independent scorable objective attempts | Show n; omit unverified/off-topic attempts from score, show their count separately |
| Correct after help | Goals first incorrect/partial then explained after intervention | Not equivalent to independent mastery |
| Corrections made | Distinct misconception IDs corrected with accepted learner evidence | Repetition does not farm points |
| Active learning time | Sum of accepted foreground activity intervals while typing/reading | Estimate; exclude hidden tab, idle >60s and provider wait |
| Session elapsed time | End/pause minus start timestamps | Includes waits; label separately if shown |
| Needs review | Required objectives with unresolved source/evaluation issues | Never count as failure or success |
| Sessions completed | Sessions meeting exact completion predicate | Paused session is not completed |

First-try scoring unit is (session, objective), not individual facts or number of messages. Denominator is frozen to the eligible first independent attempt per objective. If teacher review changes verdict, recompute and label revised. With zero eligible attempts show “Not enough evidence,” not 0%. With only a few attempts show count prominently; do not claim a stable ability measure.

## Time implementation
Client emits visibility-aware heartbeat at 15-second intervals only during session activity. Server bounds claimed increments, deduplicates events and excludes intervals during generation. Reading time is imperfectly observed; label active time as an estimate. It does not affect correctness, completion or ranking. Never collect keystroke content or camera attention data.

## Student result
Large “You explained 4 of 4 goals” only when true. Cards: first-try accuracy with denominator, active time, corrected misunderstandings. Below: each goal with short evidence-based feedback and one next lesson/retry action. An incomplete result says what remains; no false celebration. Use restrained optional animation and reduced-motion support.

## Teacher's one-word label
| Label | Rule |
| --- | --- |
| Untested | No relevant submitted/evaluated evidence |
| Developing | Some attempts, completion criteria not yet met |
| Explained | All required goals explained in this lesson version |
| Unverified | Required claim cannot yet be assessed reliably |

Use precedence Unverified over Explained when any required uncertainty remains; otherwise all goals explained → Explained; any attempt → Developing; no attempt → Untested.
These describe a lesson at a time, not a pupil. Example under alias: “Heat transfer · Developing”. Expanded view states “Can explain heat direction; still needs to explain insulation.”
Do not display “weak,” “slow,” IQ-style ratings or an inferred overall intelligence label.

## Teacher dashboard
Filter one class and lesson version. Show roster, status, goals fraction, first-try n, active time, last attempt and review flags. Class averages must show participant count and exclude untested learners from accuracy averages. Do not merge scores across unlike lessons into a universal mastery rank. Private independent sessions never enter class aggregates.

## Validation
Use a known event fixture and manually compute each metric. Check double submissions, retries, pauses, hidden tabs, no attempts, all-unverified session and revised teacher assessment. Assert client cannot directly set scores or completion.
