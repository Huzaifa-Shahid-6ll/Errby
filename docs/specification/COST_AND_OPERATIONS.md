# Cost and operations
Planning checked 16 September 2026. No services purchased. Exact spend cap remains the user's decision; use the smallest practical allowance.

## Suggested demo budget
| Item | Planning allowance | Condition |
| --- | --- | --- |
| Web hosting | $0 initially | Vercel Hobby only if the deployment fits its personal/non-commercial conditions and limits |
| Database/auth/storage | $0 initially | Supabase Free limits; modest test population and uploads |
| Model API | Reserve $10–20 | Usage-based estimate, not a provider minimum or guaranteed total |
| Custom domain | $0 | Use supplied hosting domain for hackathon |
| Analytics service | $0 | Compute required learning metrics in own database |
| Optional upgrades | Not assumed | Only after a concrete quota, eligibility or reliability issue |

Vercel Hobby is restricted to personal non-commercial use and lacks full team collaboration features; one owner deploys while teammates collaborate through Git. A paid/institutional rollout needs plan review. [Official plan](https://vercel.com/docs/plans/hobby).
Supabase Free currently includes 500 MB database and 1 GB storage, and may pause after inactivity. Monitor limits and keep the demo verified before judging. Free is suitable as a constrained prototype assumption, not a production school SLA. [Official pricing](https://supabase.com/pricing).

## Model candidate and reproducible estimate
GPT-4.1 mini lists $0.40 / million input tokens and $1.60 / million output tokens. Use it as a candidate, not an assumption of sufficient evaluator quality. [Official model page](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
Illustrative session: 120,000 total input tokens across all calls plus 12,000 output tokens → $0.048 + $0.0192 = $0.0672.
100 such sessions → $6.72; 200 → $13.44, before preparation, retries, taxes, external tools and development iteration. Tokens are total billed over calls, not just the unique text length. These volumes are assumptions to replace with measured usage.
A 10,000-input/3,000-output preparation would cost about $0.0088 at those rates. Do not send an entire textbook with every turn.

## Controls
Set app-level proposed cap $15, warning at 70% and stop new paid generation at 90% pending owner adjustment; reserve the rest for retries/in-flight work. This is a recommended policy, not approval to spend. Reserve estimated maximum cost atomically before a call; settle actual usage afterward. Account for concurrency and expired reservations. Provider budget alerts alone may not enforce a hard cap.
Rate-limit by account/class and global concurrency. Cache preparation by input hash + prompt version + grade; never share private source text between owners. Bound retries and output tokens. Record role/model/token/cost per request.

## Reliability
Persist before provider calls; structured output validation; retry at most once for malformed data; exponential backoff within a small time budget for rate limits. Pending jobs/turns have TTL leases. Keep user drafts and stored answers. Smoke-test deploy URL and seeded accounts daily near judging.
Export schema and synthetic fixtures; preserve real database backup privately if needed. Do not commit backup contents. Use one lead-owned environment; no credentials copied in chat.

## Operational kill switches
Disable new model calls without disabling history. Disable link fetching independently. Temporarily unpublish a flawed school lesson without deleting historical sessions. Restrict public demo access if cost abuse appears. Changes must not fabricate successful results.
