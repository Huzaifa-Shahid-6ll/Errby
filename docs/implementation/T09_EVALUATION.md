# T09 — evaluator and Supervisor decision contract

Implemented 26 September 2026 as a server-only validation boundary. `validateEvaluationDecision` checks strict bounded output, lesson objective and source IDs, source-checked citations, learner quotes, copied-correction independence, uncertainty reasons and required Supervisor triggers. Missing or conflicting source evidence cannot support a verified verdict. Invalid output throws before any persistence or progress update.

The 24 fictional T03 cases remain **candidate expected judgments**, with teacher/lead review pending. The local check verifies corpus coverage and decision-gate failure paths; it does not classify answers or measure model accuracy. The existing provider boundary still sends no requests. No live evaluator, model selection, prompt version, latency, token usage, retry, persisted verdict or Supervisor message is claimed. Those need cost reservations/caps, provider eligibility, reviewed content and atomic session integration. The run record must store model ID, prompt/rubric version, expected and actual verdict, latency, token usage and failure category without logging full learner text.

Check: `node --conditions=react-server --import tsx --test tests/evaluation.test.ts`. Targeted lint and TypeScript also pass. PGlite and mocked checks do not verify hosted Auth, RLS or real AI output.

T10 may consume only validated decisions for approved misconception and follow-up selection. T11 must use persisted independent evidence for completion; neither can infer success from the candidate answer key.
