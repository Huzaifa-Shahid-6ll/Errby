import { expect, test } from "@playwright/test";

test("activity heartbeat excludes hidden, idle and provider-wait intervals", async ({
  page,
}) => {
  const id = "00000000-0000-4000-8000-000000000300";
  const state = {
    session: {
      id,
      status: "awaiting_student",
      visibility: "class",
      lesson_title: "Fictional activity check",
      objective_labels: ["Explain heat flow"],
      opened_at: "2026-09-22T00:00:00Z",
      last_sequence: 0,
    },
    messages: [
      {
        id: "00000000-0000-4000-8000-000000000301",
        sequence: 0,
        role: "errby",
        text: "Explain heat flow.",
        created_at: "2026-09-22T00:00:00Z",
      },
    ],
  };
  const intervals = () =>
    page.evaluate(
      () =>
        (window as unknown as { activityIntervals: number[] })
          .activityIntervals,
    );
  await page.clock.install();
  await page.addInitScript(() => {
    const observed = window as unknown as { activityIntervals: number[] };
    observed.activityIntervals = [];
    const original = window.fetch;
    window.fetch = (input, init) => {
      if (typeof input === "string" && input.endsWith("/activity"))
        observed.activityIntervals.push(
          JSON.parse(String(init?.body)).milliseconds,
        );
      return original(input, init);
    };
  });
  await page.route(`**/api/sessions/${id}`, (route) =>
    route.fulfill({ json: state }),
  );
  await page.route(`**/api/sessions/${id}/activity`, (route) => {
    return route.fulfill({ json: { accepted_ms: 0 } });
  });
  await page.goto(`/learn/sessions/${id}`);
  await expect(page.getByRole("button", { name: "Send answer" })).toBeEnabled();
  await expect.poll(async () => (await intervals()).length).toBeGreaterThan(0);
  await page.clock.runFor(30000);
  await expect
    .poll(async () => (await intervals()).filter((ms) => ms > 0).length)
    .toBeGreaterThan(0);
  expect((await intervals()).every((ms) => ms >= 0 && ms <= 15000)).toBe(true);
  await page.clock.runFor(61000);
  const idleCount = (await intervals()).length;
  await page.clock.runFor(30000);
  expect((await intervals()).length).toBe(idleCount);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("keydown"));
  });
  await page.clock.runFor(30000);
  expect((await intervals()).length).toBe(idleCount);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("keydown"));
  });
  await page.clock.runFor(15000);
  await expect
    .poll(async () => (await intervals()).length)
    .toBeGreaterThan(idleCount);
  state.session.status = "evaluating";
  await page.getByRole("button", { name: "Refresh saved session" }).click();
  await expect(
    page.getByRole("button", { name: "Send answer" }),
  ).toBeDisabled();
  const waitingCount = (await intervals()).length;
  await page.clock.runFor(30000);
  expect((await intervals()).length).toBe(waitingCount);
});
