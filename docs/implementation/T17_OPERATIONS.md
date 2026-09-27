# T17 operations and privacy controls

The server-only OpenRouter adapter now uses pinned GPT-4.1 mini, strict JSON output, provider price ceilings, no-collection/ZDR routing, a 45-second timeout and bounded output. Provider routing flags do not establish school consent or account-level privacy acceptance. Caller validators still check lesson grounding and evaluation evidence. No paid provider call was made by the operations implementation or tests.

`model_budget` starts empty and has no client policy. An operator must set a reviewed cap before calls can succeed. Reservations serialize across workers, stop above 90% of the cap, allow at most two unsettled calls, and enforce a default $0.03 per-call maximum. The adapter reserves a conservative byte/token upper bound before dispatch. `claim_model_request` atomically permits exactly one worker to dispatch. Successful parsed responses and billing metadata are cached privately for replay after interrupted application writes. Cached responses expire after 30 days and are scrubbed on account deletion. Known billed failures settle with their cost; ambiguous timeouts or missing usage remain fully reserved until manual reconciliation. Expired leases never authorize another provider call. The operator script caps configuration at $1 total and $0.03 per call for this synthetic verification scope.

Live account deletion is available on `/setup`. It requires current Auth identity, same origin and explicit `DELETE` confirmation. Auth deletion cascades learner data through foreign keys; teachers with classes are directed to the operator. The operator can explicitly remove a class before the teacher retries account deletion. **Class removal permanently deletes the class, memberships, sources, lessons and associated learner sessions.** It is never run automatically. No source binaries are currently persisted to Storage. Billing totals remain with their owner reference cleared and generated response content scrubbed. General logs omit prompt/chat payloads.

`expire_learner_records()` is a service-only maintenance function. It redacts raw conversation text, evidence quotes, interventions and event metadata after 30 days, closes old unfinished sessions, and deletes session records after 90 days. It is not scheduled automatically; an operator must arrange and verify a daily run in a hosted project before claiming retention is enforced. The retained 30–90 day assessment structure contains verdicts and objective IDs for summaries. This is a proposed default pending school/lead policy review.

## Operator commands

Use a configured non-local synthetic project with every migration applied, `ERRBY_MODE=live` and `ERRBY_OPERATOR_CONFIRM=synthetic-test-project`. Commands read JSON from stdin; all mutations require `--confirm`. These examples are instructions, not evidence of execution.

```powershell
'{"action":"status"}' | npm run ops:manage
'{"action":"budget","capUsd":1,"maxCallUsd":0.03,"enabled":true}' | npm run ops:manage -- --confirm
'{"action":"budget","capUsd":1,"maxCallUsd":0.03,"enabled":false}' | npm run ops:manage -- --confirm
'{"action":"retention"}' | npm run ops:manage -- --confirm
```

`status` reports the cap, committed liability and unresolved request IDs without prompts, cached outputs or credentials. For manual reconciliation, verify the exact request against provider billing, then submit `action: "reconcile"`, `requestKey`, `tokens`, `cost`, `modelId`, `providerId`, and `confirmedBilling: true` with `--confirm`. This marks the response unavailable and settles only the confirmed charge; do not enter zero merely because a request timed out.

For destructive class removal, submit `action: "class-delete"`, `classId` and `confirmClassId` containing the same full UUID with `--confirm`, only after agreeing on the permanent deletion described above. Then the teacher can retry account deletion. No class was deleted during these checks.

After enabling hosted `pg_cron`, an operator can schedule the existing retention function:

```sql
select cron.schedule('errby-retention', '0 3 * * *', 'select public.expire_learner_records()');
select jobid, jobname, schedule, active from cron.job where jobname = 'errby-retention';
select status, start_time, end_time, return_message from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'errby-retention')
order by start_time desc limit 7;
```

No scheduled retention run is claimed until hosted job results confirm it. [Supabase cron documentation](https://supabase.com/docs/guides/cron/quickstart).

PGlite verifies cap, claim, settlement/cache idempotency, role denial and cache deletion/expiry behavior. Mocked provider tests verify dispatch/replay, configuration rejection, usage settlement and ambiguous failures. Operator command tests verify limits and confirmations. They do not establish hosted Auth, Storage, provider billing, live concurrency or scheduled retention. Human lesson review and school/provider requirements remain open.
