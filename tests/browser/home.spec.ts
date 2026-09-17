import { expect, test } from "@playwright/test";

test("home, topic preservation, fictional lesson, theme and responsive width", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "What are you teaching",
  );
  await expect(page.getByText("Local demo", { exact: true })).toBeVisible();
  await page
    .getByLabel("Your topic or learning material")
    .fill("Equivalent fractions");
  await page.getByRole("button", { name: "Preview topic" }).click();
  await expect(page.getByRole("status")).toContainText("not connected");
  await page.getByRole("button", { name: "Open example" }).click();
  await expect(
    page.getByRole("heading", { name: "Supervisor", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("0 of 3 goals explained")).toBeVisible();
  await expect(page.getByLabel("Your topic or learning material")).toHaveValue(
    "Equivalent fractions",
  );
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator(".workspace")).toHaveCSS(
    "background-color",
    "rgb(18, 23, 34)",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Use light theme" }).click();
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Close example" }).click();
  await expect(
    page.getByRole("button", { name: "Open example" }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});

test("keyboard skip link reaches main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to learning space" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});
