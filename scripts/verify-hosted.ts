import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

// Explicit hosted synthetic acceptance; never part of the offline test suite.
// node --env-file=.env.local --env-file=.env.hackathon --import tsx scripts/verify-hosted.ts
const required = (name: string) => {
  const value = process.env[name];
  assert(value, `Missing ${name}`);
  return value;
};
assert.equal(process.env.ERRBY_OPERATOR_CONFIRM, "synthetic-test-project");
const url = required("SUPABASE_URL");
assert(new URL(url).hostname.endsWith(".supabase.co"));
const client = () =>
  createClient(url, required("SUPABASE_PUBLISHABLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
const accounts = [
  { prefix: "TEACHER", role: "teacher" },
  { prefix: "LEARNER", role: "learner" },
  { prefix: "OTHER", role: "learner" },
];
let passed = 0;
try {
  const signed = [];
  for (const account of accounts) {
    const db = client();
    const email =
      account.role === "teacher"
        ? required(`HACKATHON_${account.prefix}_EMAIL`)
        : `${required(`HACKATHON_${account.prefix}_USERNAME`)}@students.errby.invalid`;
    const login = await db.auth.signInWithPassword({
      email,
      password: required(`HACKATHON_${account.prefix}_PASSWORD`),
    });
    assert(
      !login.error && login.data.user,
      `${account.prefix}: provider sign-in failed`,
    );
    const user = await db.auth.getUser();
    assert(
      !user.error && user.data.user?.id === login.data.user.id,
      `${account.prefix}: verified user mismatch`,
    );
    const profile = await db.from("profiles").select("auth_user_id,role");
    assert(
      !profile.error && profile.data?.length === 1,
      `${account.prefix}: own-profile RLS failed`,
    );
    assert.equal(profile.data[0].role, account.role);
    assert.equal(profile.data[0].auth_user_id, user.data.user.id);
    const refresh = await db.auth.refreshSession();
    assert(
      !refresh.error && refresh.data.session,
      `${account.prefix}: token refresh failed`,
    );
    signed.push({
      ...account,
      db,
      id: user.data.user.id,
      refreshToken: refresh.data.session.refresh_token,
    });
    passed += 3;
  }
  const classId = required("HACKATHON_CLASS_ID");
  for (const account of signed) {
    const result = await account.db
      .from("classes")
      .select("id,title")
      .eq("id", classId);
    assert(!result.error, `${account.prefix}: class read failed`);
    assert.equal(
      result.data?.length,
      account.prefix === "OTHER" ? 0 : 1,
      `${account.prefix}: class scope failed`,
    );
    const secrets = await account.db
      .from("classes")
      .select("join_code_hash")
      .eq("id", classId);
    assert(secrets.error, `${account.prefix}: secret column accessible`);
    const ledger = await account.db.from("usage_ledger").select("id");
    assert(
      ledger.error || ledger.data?.length === 0,
      `${account.prefix}: private billing accessible`,
    );
    const rpc = await account.db.rpc("assert_learning_session_access", {
      p_learner: account.id,
      p_session_id: "00000000-0000-4000-8000-000000000000",
    });
    assert(
      rpc.error?.code === "42501",
      `${account.prefix}: service-only RPC permission failed`,
    );
    passed += 4;
  }
  const anonymous = await client().from("profiles").select("auth_user_id");
  assert(
    anonymous.error || anonymous.data?.length === 0,
    "Anonymous profile access",
  );
  passed++;
  for (const account of signed) {
    const logout = await account.db.auth.signOut({ scope: "local" });
    assert(!logout.error, `${account.prefix}: sign-out failed`);
    const revoked = await client().auth.refreshSession({
      refresh_token: account.refreshToken,
    });
    assert(
      revoked.error,
      `${account.prefix}: signed-out refresh token still accepted`,
    );
    passed++;
  }
  console.log(
    JSON.stringify({
      checksPassed: passed,
      scope: "hosted Auth and JWT RLS",
      paidCalls: 0,
    }),
  );
} catch (error) {
  // SDK payloads, tokens, credentials and database rows must never reach logs.
  console.error(
    error instanceof assert.AssertionError
      ? error.message
      : "Hosted verification failed",
  );
  process.exitCode = 1;
}
