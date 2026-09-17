# Architecture recommendation
Status: selected planning default under the user's request to choose an appropriate minimal-cost stack. No application has been built.

## Stack
Next.js App Router with TypeScript; Tailwind and accessible shadcn/Radix primitives; Supabase Postgres, Auth and private Storage; one Vercel deployment managed by the lead; server-side model adapter with GPT-4.1 mini as the first evaluation candidate. Preserve exact working versions in a lockfile at setup; this specification does not invent future package versions.

Next.js supports an App Router application structure ([official documentation](https://nextjs.org/docs/app)). Supabase row policies support database access isolation; implement and test explicit policies rather than relying on hidden UI controls ([RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)). Hosting/model limitations are in COST_AND_OPERATIONS.md and PRIVACY_AND_SAFETY.md.

## Logical services
1. Browser: composer, typed session, class/teacher screens. No model or service-role secrets.
2. Application server: authentication/authorisation, parsing, preparation jobs, model calls, evaluation validation, session transitions and analytics.
3. Database: canonical lesson versions, messages, evaluations, memberships, event data and cost ledger.
4. Private object storage: temporary source documents scoped to owner/class.
5. Model provider: stateless requests with minimum relevant lesson context, no names or roster data.

## Three AI responsibilities
Preparation creates structured lesson drafts; evaluation/supervision checks each learner submission; Errby produces the next learner-facing question. These are logical roles with separate instructions and schemas, not autonomous processes exchanging unlimited messages. Evaluation can return a supervisor correction directly; do not add a redundant fourth call.

## Submission transaction
Authenticate and authorise → reserve idempotent turn and cost allowance → persist learner message → evaluate against immutable lesson version → validate structured output and source IDs → persist evidence/intervention → optionally request Errby's next response → commit final turn state. The browser renders ordered results from the server. Do not stream unchecked instructional claims while evaluation is still pending.
Use a short session lease or expected sequence number to prevent two tabs advancing a session concurrently. Never hold a database transaction open during a provider call. Persist intermediate states and recover expired leases.

## Preparation jobs without a queue service
Use a database job record and bounded steps. The browser calls the next authorised step while the preparation view is open; the server claims the step atomically and stores progress/results. Closing the tab leaves an honest resumable job, not a promise of continuing in the background. On return, resume pending work.
Start with small batches (up to three detailed lessons per step) and explicit output limits. If measured processing cannot fit hosting limits, move this worker behind a proper durable queue; do not pretend in-process work survives request termination.

## Retrieval
For bounded MVP lessons, store paragraph/page chunks and select relevant spans using lesson mapping and basic text retrieval. Pass only referenced chunks plus a compact conversation summary. A vector database is not necessary for the first reviewed lesson pack. Retrieval upgrades must justify cost and evaluation gains.

## Deployment boundaries
Use one preview environment with synthetic accounts and one judge-ready deployment. Supabase migrations versioned in the public repository contain no data. Secrets stay in environment settings. Seed script creates only clearly labelled demonstration records. Source uploads, personal data, access codes, tokens and production backups are excluded from Git.

## Proposed source organisation
app/: routes and UI
components/: shared primitives and Errby/Supervisor message renderers
lib/auth/, lib/lessons/, lib/ai/, lib/analytics/, lib/jobs/: domain modules
supabase/migrations/: schema and RLS
tests/: deterministic rules, permissions and evaluated lesson fixtures
docs/: this pack and subsequent decisions

Boundaries matter more than a large folder tree. Begin with the smallest end-to-end slice.
