# Learning design and completion
## Teaching approach
The user's Feynman-style goal means the learner explains a concept simply in their own words, addresses gaps, and can apply it. This is an instructional design choice; do not claim the named method guarantees retention or grades.

## Lesson contract
Each lesson version has a level, 3–5 recommended core objectives, objective-specific acceptable explanations, essential facts, supported source spans, plausible misconceptions with correct resolutions, initial open question, follow-up examples and application prompts. Avoid objective explosion from entire textbook chapters. When the topic is large, divide it into selectable lessons before the session.

## Evidence per objective
Use states: untested, developing, explained, unverified. “Explained” requires a substantively correct explanation containing the required relationships, no contradictory claim left standing, and evidence the learner can reason rather than echo a supplied correction. For a corrected misconception, use a changed example or short application. Accept equivalent wording and age-appropriate vocabulary. Spelling, grammar, speed and unnecessary technical terms are not correctness criteria.

A single learner answer can supply evidence for several objectives, but evaluate each separately. Record exact supporting message spans and source references. Unsupported model confidence is not evidence. A partial explanation gets a focused follow-up.

## Intentional error rules
The initial question contains no deliberate error. Errby may later misunderstand one concept at a time. Store the misconception ID and intended correction. Avoid false claims about safety, medical treatment, personal identity or sensitive topics. Never introduce novel unsupported misconceptions simply to prolong the session.
If the learner already corrects Errby accurately, acknowledge it and move on. If the learner agrees with a false premise, supervision occurs after the submission before Errby reinforces it. Repetition of an earlier error is logged, not mocked.

## Supervisor and uncertainty
The supervisor can explain, ask for a restatement, or flag a point as unverified. It is not an infallible authority. Conflicting or absent references cannot become correct solely because another model agrees. Correct the record visibly when the app made an unintended error. A supervisor-given answer does not automatically earn learner credit.

## Completion predicate
Complete when ALL required objective records for the session's immutable lesson version are explained with valid learner evidence and there are NO unresolved contradictions or unverified required claims. Compute this on the server from persisted evidence. Do not let an LLM emit session_complete as an authoritative command.
User-requested early exit is paused/ended_incomplete. A retry limit or time limit can pause; it cannot pass a lesson. A teacher can remove an invalid objective only via an explicit audited revision; explain the resulting scope change and preserve original history.

## Practical example
Topic: why ice melts in a warmer room.
Objectives: identify thermal energy transfer from warmer surroundings, distinguish melting from temperature increase during the idealised phase change, explain why insulation can slow transfer.
Initial prompt: “Explain why ice melts in a warm room.”
Misconception follow-up: “So the ice creates the heat it needs?”
Supervisor if learner agrees: “The heat comes from warmer surroundings. The ice receives that energy. Can you explain that direction of transfer?”
Application: “Why might an insulated container keep ice solid longer?”
Exact depth depends on selected grade. Do not impose latent-heat equations on younger pupils.

## Session limits
Aim for concise exchanges and 3–5 objectives, not a promised duration. After three unsuccessful attempts on a goal, offer a supportive explanation and pause option. Keep it unresolved until fresh evidence warrants a change. Student may request simpler wording without penalty.
