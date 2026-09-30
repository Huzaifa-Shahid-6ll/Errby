import { expect, test } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { createClient } from "@supabase/supabase-js";

const configured =
  process.env.CLERK_SECRET_KEY?.startsWith("sk_test_") &&
  process.env.ERRBY_APP_ORIGIN &&
  process.env.CLERK_TEST_IDENTIFIER &&
  process.env.CLERK_TEST_PASSWORD;
test.skip(
  !configured,
  "Requires development Clerk and the configured synthetic password account",
);
test.beforeAll(async () => {
  if (configured) await clerkSetup();
});

test("real sign-in opens chat; origin, validation, private RLS and sign-out fail closed without model calls", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.CLERK_TEST_IDENTIFIER!,
      password: process.env.CLERK_TEST_PASSWORD!,
    },
  });
  await page.goto("/learn");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "What can you teach me?",
  );
  await expect(
    page.getByRole("textbox", { name: "Message Errby" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("link", { name: /classes|prepare material/i }),
  ).toHaveCount(0);
  for (const route of [
    "/classes",
    "/prepare",
    "/api/classes",
    "/api/preparations",
  ])
    expect((await page.request.get(route)).status()).toBe(404);
  expect(
    (
      await page.request.post("/api/chat", {
        headers: { origin: "https://untrusted.invalid" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const invalid = await page.request.post("/api/chat", {
    headers: { origin: process.env.ERRBY_APP_ORIGIN! },
    data: {},
  });
  expect(invalid.status()).toBe(400);
  expect(invalid.headers()["cache-control"]).toContain("no-store");
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
  const mapped = await admin
    .from("clerk_identities")
    .select("user_id")
    .eq("clerk_user_id", process.env.CLERK_TEST_USER_ID!)
    .single();
  expect(mapped.error).toBeNull();
  const foreign = await admin
    .from("sessions")
    .select("id")
    .neq("learner_id", mapped.data!.user_id)
    .eq("visibility", "private")
    .limit(1)
    .single();
  expect(foreign.error).toBeNull();
  expect(
    (await page.request.get(`/api/sessions/${foreign.data!.id}`)).status(),
  ).toBe(404);
  const token = await page.evaluate(async () =>
    (
      window as unknown as {
        Clerk: { session: { getToken(): Promise<string> } };
      }
    ).Clerk.session.getToken(),
  );
  const scoped = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { accessToken: async () => token },
  );
  const isolated = await scoped
    .from("sessions")
    .select("id")
    .eq("id", foreign.data!.id);
  expect(isolated.error).toBeNull();
  expect(isolated.data).toEqual([]);
  const forbidden = await scoped.rpc("open_private_chat", {
    p_learner: mapped.data!.user_id,
    p_version: foreign.data!.id,
  });
  expect(forbidden.error).not.toBeNull();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Message Errby" }),
  ).toBeEnabled();
  await page.goto("/setup");
  await page.waitForFunction(
    () =>
      (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded ===
      true,
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in to Errby" }),
  ).toBeVisible({ timeout: 30_000 });
  expect(
    (
      await page.request.post("/api/chat", {
        headers: { origin: process.env.ERRBY_APP_ORIGIN! },
        data: {},
      })
    ).status(),
  ).toBe(401);
});
