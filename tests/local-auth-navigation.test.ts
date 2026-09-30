import assert from "node:assert/strict";
import test from "node:test";

// Run against the configured local live server with --env-file=.env.local.
const origin = process.env.ERRBY_APP_ORIGIN;
test(
  "local sign-in aliases redirect once and protected returns exclude RSC internals",
  {
    skip:
      process.env.ERRBY_MODE !== "live" ||
      !origin ||
      !["localhost", "127.0.0.1"].includes(new URL(origin).hostname),
  },
  async () => {
    const alias = new URL(origin!);
    alias.hostname = alias.hostname === "localhost" ? "127.0.0.1" : "localhost";
    const path = "/sign-in?next=%2Flearn%3F_rsc%3DGVyxBV1nCXGnd9F_";
    const response = await fetch(alias.origin + path, { redirect: "manual" });
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), origin + path);
    const canonical = await fetch(origin + path, { redirect: "manual" });
    assert.equal(canonical.status, 200);
    assert.equal(canonical.headers.get("location"), null);
    const protectedPage = await fetch(origin + "/learn?_rsc=internal", {
      redirect: "manual",
    });
    assert.equal(protectedPage.status, 307);
    const signIn = new URL(protectedPage.headers.get("location")!, origin);
    assert.equal(signIn.pathname, "/sign-in");
    assert.equal(signIn.searchParams.get("next"), "/learn");
    const api = await fetch(alias.origin + "/api/preparations", {
      redirect: "manual",
    });
    assert.equal(api.status, 401);
    assert.equal(api.headers.get("location"), null);
  },
);
