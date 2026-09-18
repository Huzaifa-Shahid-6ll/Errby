import { expect, test } from "@playwright/test";

test("demo account screen is honest and offers no fake sign-in", async ({
  page,
}) => {
  await page.goto("/setup");
  await expect(
    page.getByRole("heading", { name: "Sign in to Errby" }),
  ).toBeVisible();
  await expect(page.getByText(/Account sign-in is unavailable/)).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Back to Errby" }).click();
  await expect(page.getByText("Local demo", { exact: true })).toBeVisible();
});
