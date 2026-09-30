import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync, sign } from "node:crypto";
import { createClerkClient } from "@clerk/backend";
import { safeDestination } from "../src/lib/auth/redirect";
import { trustedClerkClaims } from "../src/lib/auth/identity";
import { parseEnv } from "../src/lib/env/schema";

test("local return paths reject external URLs, encodings and auth loops", () => {
  for (const bad of [
    undefined,
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2f%2fevil.test",
    "/sign-in",
    "/setup",
    "/api/account",
    "/learn/../../sign-in",
    "/prepare/extract",
    "/learn\n",
  ])
    assert.equal(safeDestination(bad), "/learn");
  assert.equal(
    safeDestination("/classes/abc/results?view=summary"),
    "/classes/abc/results?view=summary",
  );
});

test("live configuration rejects missing/mixed keys and untrusted origins without leaking values", () => {
  assert.throws(() => parseEnv({ ERRBY_MODE: "live" }), /CLERK_SECRET_KEY/);
  const config = {
    ERRBY_MODE: "live",
    SUPABASE_URL: "https://synthetic.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "fixture",
    SUPABASE_SECRET_KEY: "fixture",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fixture",
    CLERK_SECRET_KEY: "sk_live_never-print-this",
    CLERK_ISSUER_URL: "https://synthetic.clerk.accounts.dev",
    ERRBY_APP_ORIGIN: "https://errby.example/path",
  };
  assert.throws(
    () => parseEnv(config),
    (e: unknown) =>
      e instanceof Error &&
      !e.message.includes("never-print-this") &&
      e.message.includes("matching Clerk"),
  );
});

test("installed Clerk SDK rejects invalid session tokens (ephemeral test keys, no live Clerk calls)", async () => {
  const issuer = "https://synthetic.clerk.accounts.dev";
  const origin = "http://127.0.0.1:3100";
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  // Synthetic credentials exist only in this test; never loaded by the app.
  const clerk = createClerkClient({
    secretKey: "sk_test_fixture",
    publishableKey: `pk_test_${Buffer.from("synthetic.clerk.accounts.dev$").toString("base64")}`,
    jwtKey: publicKey.export({ type: "spki", format: "pem" }).toString(),
  });
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: issuer,
    azp: origin,
    sub: "user_synthetic",
    sid: "sess_synthetic",
    iat: now,
    nbf: now - 5,
    exp: now + 60,
    v: 2,
    sts: "active",
  };
  function token(overrides = {}) {
    const data = [
      { alg: "RS256", typ: "JWT", kid: "synthetic" },
      { ...claims, ...overrides },
    ]
      .map((v) => Buffer.from(JSON.stringify(v)).toString("base64url"))
      .join(".");
    return `${data}.${sign("RSA-SHA256", Buffer.from(data), privateKey).toString("base64url")}`;
  }
  async function accepted(value?: string) {
    const state = await clerk.authenticateRequest(
      new Request(`${origin}/api/sessions`, {
        headers: value ? { Authorization: `Bearer ${value}` } : {},
      }),
      { acceptsToken: "session_token", authorizedParties: [origin] },
    );
    const verified = state.toAuth();
    return (
      state.isAuthenticated &&
      trustedClerkClaims(verified?.sessionClaims, issuer, origin)
    );
  }
  assert.equal(
    await accepted(token()),
    true,
    "SDK verifies the synthetic signature",
  );
  for (const invalid of [
    undefined,
    "malformed",
    token({ exp: now - 60 }),
    token({ nbf: now + 60 }),
    token({ iss: "https://wrong.clerk.accounts.dev" }),
    token({ azp: "https://evil.test" }),
    token({ azp: undefined }),
    token({ sts: "pending" }),
    "m2m_invalid",
    "ak_invalid",
    "oat_invalid",
  ])
    assert.equal(await accepted(invalid), false);
  const valid = token();
  const [header, payload, signature] = valid.split(".");
  const altered = Buffer.from(
    JSON.stringify({
      ...JSON.parse(Buffer.from(payload, "base64url").toString()),
      sub: "user_other",
    }),
  ).toString("base64url");
  assert.equal(await accepted(`${header}.${altered}.${signature}`), false);
});
