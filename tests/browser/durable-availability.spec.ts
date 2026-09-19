import { expect, test } from "@playwright/test";

test("durable API routes fail closed without a configured live account", async ({
  request,
  baseURL,
}) => {
  const id = "00000000-0000-4000-8000-000000000001";
  for (const path of ["/api/preparations", `/api/preparations/${id}`]) {
    const response = await request.get(path);
    expect(response.status()).toBe(503);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.json()).toMatchObject({
      error_code: "live_setup_required",
    });
  }
  const response = await request.post(`/api/preparations/${id}/step`, {
    headers: { Origin: new URL(baseURL!).origin },
    data: { expected_step: 0 },
  });
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({
    error_code: "live_setup_required",
  });
});

test("durable writes reject cross-origin requests before processing source data", async ({
  request,
}) => {
  const response = await request.post("/api/preparations", {
    headers: { Origin: "https://unrelated.invalid" },
    multipart: { kind: "text", text: "Fictional test source" },
  });
  expect(response.status()).toBe(403);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.json()).toMatchObject({
    error_code: "forbidden_origin",
  });
});
