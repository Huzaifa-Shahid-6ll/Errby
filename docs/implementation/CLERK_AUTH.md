# Clerk authentication — 30 September 2026

Errby remains a Next.js App Router monolith: TypeScript 6.0.3, Next 16.3.5,
React 19.3.0, Node 24.18.0, npm 11.16.0, Tailwind 4.3.3, hosted Supabase and
Vercel configuration. No framework upgrade, new database, Docker, deployment
or paid model call is part of this change.

## Integration and official references

Checked 28–30 September 2026 through Context7, official documentation and
installed definitions. Installed: `@clerk/nextjs` 7.9.7, `@clerk/backend` 3.20.1,
`@clerk/ui` 1.36.0, `@clerk/testing` 2.2.39, `@supabase/supabase-js` 2.116.0.

- [Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Clerk middleware](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Request authentication](https://clerk.com/docs/reference/backend/authenticate-request)
- [Session tokens](https://clerk.com/docs/guides/sessions/session-tokens)
- [Supabase native integration](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase third-party Clerk authentication](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Migration guidance](https://clerk.com/docs/guides/development/migrating/overview)
- [Sensitive-action reverification](https://clerk.com/docs/guides/secure/reverification)
- [Playwright support](https://clerk.com/docs/guides/development/testing/playwright/overview)
- [Next.js authentication](https://nextjs.org/docs/app/guides/authentication)
- [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

The installed Next guides in `node_modules/next/dist/docs/` were also consulted.
Next 16 uses `src/proxy.ts`. `skipProxyUrlNormalize` preserves the configured
127.0.0.1 origin: otherwise Next normalized it to localhost and Clerk's internal
rewrite caused a reproduced self-proxy loop. No cross-origin API or CORS layer
is needed. Browser, routes and cookies share `ERRBY_APP_ORIGIN`.

`ClerkProvider` is at the live application root; maintained SignIn, SignUp and
UserProfile components handle verification, recovery, provider callbacks,
session tasks and errors with the existing theme. Demo never initializes a
mock identity. Auth pages preserve only validated local learning destinations.
Sign-out/account changes clear learning drafts, session storage and router state.

Clerk's management client does **not** authenticate incoming requests.
`clerkMiddleware` and `getClerkSession()` verify completed session tokens only,
with the configured issuer and authorized party. SDK verification handles
signatures, expiry and key rotation. Machine/API/OAuth access tokens are denied.
`getIdentity()` sends the Clerk token to Supabase's native third-party verifier,
then resolves the protected UUID mapping and profile through RLS. An unmapped,
authenticated student gets a learner profile automatically, after a current
Clerk user check. Only this bounded bootstrap uses service credentials; profile
reads still use the original user's RLS client. Unauthenticated requests never
reach provisioning.

## Actual access surfaces

| Surface                                                                                                                            | Access                                           | Identity                                           | Permission                                                                  | Enforcement                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `/`, static assets, `/api/health`                                                                                                  | Public                                           | None                                               | None                                                                        | Public routes; health discloses no credentials              |
| `/sign-in/**`, `/sign-up/**`                                                                                                       | Public                                           | Clerk flow, including callback subpaths            | Completed session needed for learning                                       | Clerk prebuilt flows; local redirect allowlist              |
| `/setup`                                                                                                                           | Public shell, private account details            | Clerk session                                      | Own identity; automatic student registration                                | Server component and `getIdentity`                          |
| `/account/**`                                                                                                                      | Protected                                        | Clerk session                                      | Own sign-in settings                                                        | Server guard and Clerk UserProfile                          |
| `/learn`, `/learn/sessions/[id]`, `/learn/sessions/[id]/results`, `/prepare`, `/prepare/[id]`, `/classes`, `/classes/[id]/results` | Protected in live mode                           | Clerk session + mapped profile                     | Ownership/current class membership; teacher for class administration        | Proxy, server identity, existing scoped services and RLS    |
| `/api/preparations`, `/api/preparations/[id]`, `/step`, `/review` (the latter two under `[id]`)                                    | Protected                                        | Same                                               | Owner; active owned class; teacher publication approval                     | Proxy + route access + service predicates/RPC               |
| `/api/sessions`, `/api/sessions/[id]`, `/turns`, `/pause`, `/process`, `/activity` (under `[id]`)                                  | Protected                                        | Same                                               | Session owner and current class access; private sessions remain private     | Proxy + session services/RPC and RLS                        |
| `/api/classes`, `/api/classes/[id]/code`, `/api/classes/[id]/results`                                                              | Protected                                        | Same                                               | Teacher and owned class                                                     | Server role/class checks                                    |
| `/api/classes/preview`, `/api/classes/join`                                                                                        | Protected                                        | Same                                               | Learner; bounded valid class code                                           | Server role/code checks                                     |
| `/api/assessments/[id]/review`                                                                                                     | Protected                                        | Same                                               | Teacher of the assessment's class                                           | Server scoped review service/RPC                            |
| `/prepare/extract`                                                                                                                 | Protected live; fictional bounded sample in demo | Same in live mode                                  | Authenticated profile                                                       | Proxy + extraction guard before body parsing                |
| `DELETE /api/account`                                                                                                              | Protected                                        | Recent Clerk session + remote active-session check | Self; no owned classes remaining                                            | Origin check, confirmation, deletion RPC, Clerk Backend API |
| Operator scripts and private database RPC                                                                                          | Service-only                                     | Server service credentials                         | Explicit synthetic-project confirmation, reviewed mapping/teacher allowlist | CLI checks and SQL grants                                   |

There are no app webhooks, GraphQL handlers, sockets, public download handlers,
Clerk organizations, billing entitlements, native clients or invitation flows.
Private source storage retains its existing policy; no new public object policy
or service key is exposed. Existing teacher/class and learner ownership policies
are preserved. Cookie mutations require same-origin requests; APIs return JSON
401/403 rather than login HTML. Private responses and database fetches use no-store.

## Configuration

Use `.env.example`; keep actual values in ignored `.env.local` or deployment
secret settings. Live configuration validates at startup/build and fails closed.
Demo requires no credentials. Never mix development and production instances.

| Variable                                                             | Purpose/source                                          | Scope                           | Required                |
| -------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------- | ----------------------- |
| `ERRBY_MODE`                                                         | `demo` or `live`                                        | Server                          | All, defaults demo      |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`                                  | Clerk instance → API keys                               | Public browser configuration    | Live build/runtime      |
| `CLERK_SECRET_KEY`                                                   | Same instance → API keys                                | Server only                     | Live build/runtime      |
| `CLERK_ISSUER_URL`                                                   | Exact Clerk domain, HTTPS, no trailing slash            | Server                          | Live                    |
| `ERRBY_APP_ORIGIN`                                                   | Exact application origin; local `http://127.0.0.1:3000` | Server, passed as public origin | Live                    |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`                           | Hosted test project API settings                        | Server RLS client               | Live                    |
| `SUPABASE_SECRET_KEY`                                                | Hosted test project privileged API key                  | Server only                     | Live mutations/operator |
| `SUPABASE_DB_URL`                                                    | Dashboard session-pooler connection                     | Migration process only          | Hosted SQL migration    |
| `ERRBY_OPERATOR_CONFIRM`                                             | Literal `synthetic-test-project`                        | Operator only                   | Account apply           |
| `ERRBY_APPROVED_TEACHER_EMAILS`                                      | Operator-approved, already verified teachers            | Operator only                   | Teacher approval        |
| `CLERK_TEST_IDENTIFIER`, `CLERK_TEST_PASSWORD`, `CLERK_TEST_USER_ID` | Dedicated synthetic password account                    | Test runner only                | Real browser checks     |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`                             | Existing budget-controlled AI configuration             | Server only                     | AI, not authentication  |

Development Dashboard checklist (observed settings verified 30 September):

1. Use the development instance whose domain is
   `https://mint-treefrog-6607.clerk.accounts.dev`. Enable username/password;
   email optional, verify email when supplied. Username-only learners need
   operator-assisted password recovery; never invent learner emails.
2. Activate [native Supabase integration](https://dashboard.clerk.com/setup/supabase).
   Its session token must contain `role: authenticated`; no legacy JWT template
   or shared Supabase signing secret is used.
3. Supabase → Authentication → Third-party Auth → Clerk: save that exact domain.
   A successful real Clerk-authenticated RLS request verifies this connection.
4. Clerk → User & authentication → Settings: disable user self-deletion.
   Verified false through the instance API. Operator approval also disables it
   per user before creating the application mapping.
5. Keep sign-in `/sign-in`, sign-up `/sign-up`, and both continuations `/learn`.
   `ERRBY_APP_ORIGIN` must match the browser's hostname and running port exactly.
   The current local server uses `http://127.0.0.1:3000`; the old 3100 setting
   rejected otherwise valid sessions and caused repeated sign-in redirects.
   Clerk handles its
   configured provider callbacks inside the catch-all auth routes. No new social
   provider, organization, MFA policy or webhook was enabled by this work.

Production remains unconfigured and unauthorized: use separate live keys,
production domain/DNS, HTTPS origin and production Supabase third-party provider.
Review session/verification policies before cutover. Configure Vercel build and
runtime variables together; changing a public key requires rebuilding.

## Approval, migration and deletion

Migration `20260928000100_clerk_identity.sql` preserves every existing profile UUID
and owned relation. The old column name `profiles.auth_user_id` remains the
internal application UUID. `clerk_identities` uniquely maps it to Clerk subject
and issuer. Roles and memberships remain in the application database, never
user-editable metadata. Existing records are not merged by email.

The migration was applied to the configured synthetic hosted project after a
dry-run showed it was the only pending migration. Existing three legacy profiles
were retained. They are **not migrated Clerk accounts** and need reviewed linking;
their old Supabase sessions no longer grant application access. One separate
approved synthetic Clerk learner was created for acceptance testing.

Students register with Clerk and continue directly to `/learn`. Migration
`20260930000100_student_self_registration.sql` adds the service-only
`ensure_student_profile` RPC. On first authenticated access it creates an
independent learner with alias `Student`, no assumed grade and no membership.
Students supply the grade when preparing material and may join a class later.
No teacher invitation or approval is required. Existing unmapped Clerk students
also gain access on their next visit; mapped teachers and learners retain their
UUID, role and data.

The server verifies Clerk and Supabase authentication before provisioning, checks
the provider user still exists and is not banned/locked, and disables direct
provider self-deletion if needed. Imported users with an external ID require
reviewed linking. The RPC shares the operator provisioner's transaction lock,
rejects issuer conflicts and deletion markers, and never accepts a selectable
role or class. Anonymous/authenticated database clients cannot execute it.
No webhook, email match or paid model call is involved.

Teacher access and legacy identity linking still require an operator. The
existing operator flow below provisions a reviewed teacher before their first
application visit; it cannot promote an existing immutable learner role.

Prepare a private JSON array such as:

```json
[
  {
    "clerkUserId": "user_REVIEWED",
    "role": "learner",
    "alias": "Synthetic Learner",
    "grade": "middle_school"
  }
]
```

For an existing account add `existingUserId` with its reviewed UUID; the Clerk
user's `external_id` must equal that UUID. An optional `classId` must be active
and can only enroll a learner. Do not put passwords in this manifest.

```powershell
Get-Content .env.account-manifest.json -Raw | npm run account:manage
$env:ERRBY_OPERATOR_CONFIRM = 'synthetic-test-project'
Get-Content .env.account-manifest.json -Raw | npm run account:manage -- --apply
```

Dry-run validates provider identities and approved legacy pairs without writing.
Apply disables provider self-deletion and runs the constrained mapping RPC.
Output contains reviewed/applied counts; repeated application is safe. Before
import, inventory old UUIDs, owned records, memberships and roles; retain a backup.
Use Clerk's supported bcrypt password import or a deliberate verified recovery
flow. Exporting password hashes and migrating production users is not performed.
Resolve duplicate/provider identities manually through verified linking. Reconcile
input/reviewed/applied counts and UUID ownership before granting access.

Cutover replaces Supabase cookie authentication. The old operator implementation
is retained for historical tests; its executable provisioner refuses to run after
the migration. Previous app routes are available in git history. Rollback requires
maintenance mode and reviewed database restoration, not running both identity
providers indefinitely: restore pre-cutover policies/app/lockfile and reconcile
new Clerk-only profiles before restoring the `auth.users` foreign key. Preserve
new saved records. No production cutover or user-session invalidation was run.

Guarded deletion checks recent verification, the current provider session and
owned classes. It durably marks the identity inaccessible, deletes Clerk identity,
then removes the application profile using the existing cascades. Provider failure
allows retry; database cleanup failure after provider deletion requires an operator
to finish that marked profile. Never reactivate a deletion marker. Dashboard
administrator deletion is outside the app flow and requires operator reconciliation.

Local JWT verification is not instant revocation: ordinary access lasts until the
short-lived session token expires. Roles and membership are reread on each request;
in-flight authorized operations may finish. Sensitive deletion additionally checks
remote session status. No guarantee of instant global permission propagation is made.

## Run and verify

```powershell
npm ci
npm run dev
# Separate terminal, no demo override:
npm run typecheck
npm test
npm run build
npm run test:clerk:browser
```

The real suite requires an approved synthetic account and another user's saved
preparation in the dedicated hosted fixture project. This workspace keeps the
synthetic credentials in ignored `.env.clerk-test`; load it with:

```powershell
node --env-file=.env.local --env-file=.env.clerk-test node_modules/@playwright/test/cli.js test --config=playwright.clerk.config.ts
```

It disables traces, screenshots and video to avoid persisting credentials. The
regular demo suite (`npm run test:browser`) starts its own demo server; stop the
live server first. PGlite checks do not verify hosted Auth or Storage.

## Validation record

Final executed results are also recorded at the top of `docs/SETUP_STATUS.md`.
No tests below imply a production deployment or real pupil acceptance.
Further verification was handed to the user at their request. The final auth
diff has not received a completed production build, full browser regression,
format/lint gate or final secret/bundle audit. Do not treat it as release-ready.

- Passed: 47 local tests, including actual installed Clerk SDK verification with
  ephemeral test RSA keys: missing, malformed, tampered, expired, future, wrong
  issuer/party, pending-session and inappropriate token cases. These are local
  cryptographic tests, not real-provider end-to-end tests.
- Passed: PGlite migration/ownership/class-role isolation, stable old UUID mapping,
  idempotent repeated provisioning, conflicting mapping denial, deletion markers
  and teacher-class deletion guard. Its concurrent calls share one PGlite engine;
  this is not a distributed concurrency load test.
- Passed: real development username/password login, approved profile, Supabase
  protected read, browser refresh and sign-out followed by JSON 401.
- Incomplete: the expanded real browser test passed another user's preparation
  read denial, then failed because its mutation payload was invalid (`400` before
  ownership checking, expected `404`). The test now sends `expected_step: 0`;
  that correction has **not been rerun**. Its subsequent hosted RLS, protected
  write and cleanup assertions remain unverified. The earlier login/read/refresh/
  sign-out run passed independently.
- Passed earlier: `npm run typecheck`. Changes made afterward, including the
  expanded test, still need a fresh type check. Historical full lint failed on
  pre-existing landing/modal errors; the landing was subsequently replaced by
  separate work, so those old counts are not a current lint result.
- Passed: direct unauthenticated public landing/health, protected API 401 for
  missing/malformed/machine tokens, protected-page redirect, malicious return path
  rendered safely. Private API responses carry no-store.
- Not applicable: native links/storage, organizations/tenants, billing entitlements,
  app webhooks and invitations; none exist in this product.
- Not verified: email delivery/password recovery, existing social providers,
  enforced MFA, real expiry/revocation timing, user-driven signup verification,
  account switching (instance single-session), real guarded account deletion,
  production rollout and full migration of historical identities.
- Dependency limitation: npm audit reports 13 moderate findings in transitive
  Clerk UI wallet dependencies. No compatible upstream fix was available at
  installation; do not apply a forced incompatible downgrade. No wallet flow is
  enabled. Recheck upstream before release.
