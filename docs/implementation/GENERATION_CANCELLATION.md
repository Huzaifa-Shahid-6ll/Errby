# Generation cancellation

Implemented 1 October 2026 for research pattern 07. The client aborts its existing request; no cancellation registry, new endpoint, dependency or migration is needed. The Next route request signal and response reader cancellation reach the shared provider's fetch and streamed body reader. Provider timeouts still apply.

- Opening replies: partial text is not a confirmed response and must not enter finalized history. Keep the draft and original retry identity.
- Notes: completed source/preparation steps remain saved. Stop prevents subsequent generation and private-session opening. A failed active preparation releases its fenced lease; no partial generated lesson is saved.
- Saved explanations: submitted answers remain durable. Cancellation interrupts provider work and prevents later model phases, then releases the learning-turn lease. It does not fabricate a completed assessment or reverse saved evidence.
- Atomic database writes already dispatched finish normally. A commit can win the Stop race. Reload the saved conversation to establish the result; an immediate reload may precede an in-flight save. Preserve the retry key until the saved answer is confirmed.
- Dispatched provider work with no confirmed final usage stays pending in the existing cost ledger. Stop never releases uncertain spend or automatically dispatches another paid request. A completed, settled response remains replayable; ambiguous requests need the existing operations reconciliation flow.

“Stop processing” means stop this application's active provider connection and subsequent work. It does **not** promise that all provider processing or billing stops. [OpenRouter's streaming documentation](https://openrouter.ai/docs/api/reference/streaming) limits upstream cancellation to streaming requests on supported providers; structured preparation/evaluation requests may continue upstream and incur the full charge. No live-provider cancellation or hosted disconnect guarantee is claimed by the local tests.

Verification uses fictional data and provider mocks. Model tests prove response cancellation aborts the provider signal and a blocked body reader, incoming-request cancellation aborts a non-streamed fetch, pre-aborted calls do not dispatch, and uncertain calls cannot redispatch. Existing PGlite suites now exercise preparation lease recovery, saved-answer preservation without partial evaluation, skipped later model phases, and an atomic evidence commit winning the cancellation race. Scoped TypeScript, lint and these checks passed; the parent task records the final integrated run.

The integrated desktop/phone browser checks also deliver a successful result after the Stop signal to reproduce the client race. Post-read abort checks retain the draft and retry identity instead of consuming that late payload. Explicit refresh then recovers the actual saved answer. These checks passed within the 80-case browser run.
