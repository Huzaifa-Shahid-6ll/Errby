import { expect, test } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const configured =
  process.env.CLERK_SECRET_KEY?.startsWith("sk_test_") &&
  process.env.ERRBY_APP_ORIGIN &&
  process.env.CLERK_TEST_IDENTIFIER &&
  process.env.CLERK_TEST_PASSWORD;
test.skip(
  !configured,
  "Requires configured development Clerk/Supabase and an approved synthetic password account",
);
test.beforeAll(async () => {
  if (configured) await clerkSetup();
});

test("real password sign-in, protected write/read, RLS isolation, refresh and sign-out denial", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.CLERK_TEST_IDENTIFIER!,
      password: process.env.CLERK_TEST_PASSWORD!,
    },
  });
  await page.goto("/setup");
  await expect(page.getByText(/Signed in as/)).toBeVisible();
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: /^Welcome,/ })).toBeVisible();
  const privateRead = await page.request.get("/api/preparations");
  expect(privateRead.status()).toBe(200);
  expect(privateRead.headers()["cache-control"]).toContain("no-store");
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
  const mapped = await admin.from("clerk_identities").select("user_id")
    .eq("clerk_user_id", process.env.CLERK_TEST_USER_ID!).single();
  expect(mapped.error).toBeNull();
  const foreign = await admin.from("preparation_jobs").select("id")
    .neq("owner_id", mapped.data!.user_id).limit(1).single();
  expect(foreign.error).toBeNull();
  expect((await page.request.get(`/api/preparations/${foreign.data!.id}`)).status()).toBe(404);
  expect((await page.request.post(`/api/preparations/${foreign.data!.id}/step`, {
    headers: { origin: process.env.ERRBY_APP_ORIGIN! }, data: { expected_step: 0 },
  })).status()).toBe(404);
  expect((await page.request.post("/api/preparations", {
    headers: { origin: "https://untrusted.invalid" }, data: {},
  })).status()).toBe(403);
  // Real session token stays in memory; never saved in traces or printed.
  const token = await page.evaluate(async () => {
    const client = (window as unknown as { Clerk: { session: { getToken(): Promise<string> } } }).Clerk;
    return client.session.getToken();
  });
  const scoped = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    accessToken: async () => token,
  });
  const isolated = await scoped.from("preparation_jobs").select("id").eq("id", foreign.data!.id);
  expect(isolated.error).toBeNull();
  expect(isolated.data?.length).toBe(0);
  const saved = await page.request.post("/api/preparations", {
    headers: { origin: process.env.ERRBY_APP_ORIGIN!, "idempotency-key": randomUUID() },
    multipart: { kind: "text", text: "Fictional unreviewed test: warm water transfers energy to a cooler object.", subject: "Science", grade: "middle_school", scope: "Heat transfer" },
  });
  expect(saved.status()).toBe(201);
  const job = (await saved.json()).job;
  expect((await page.request.get(`/api/preparations/${job.id}`)).status()).toBe(200);
  // Source extraction/persistence only: never advance into a paid model step.
  const cleanup = await admin.from("source_documents").delete().eq("id", job.source_id).eq("owner_id", mapped.data!.user_id);
  expect(cleanup.error).toBeNull();
  await page.reload();
  await expect(page.getByRole("heading", { name: /^Welcome,/ })).toBeVisible();
  await page.goto("/setup");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in to Errby" }),
  ).toBeVisible();
  expect((await page.request.get("/api/preparations")).status()).toBe(401);
});
