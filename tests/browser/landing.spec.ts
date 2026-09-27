import { expect, test } from "@playwright/test";

test("landing exposes sign-in and account setup on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(
    header.getByRole("link", { name: "Sign up", exact: true }),
  ).toBeVisible();
  await header.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/setup$/);
  await expect(
    page.getByRole("heading", { name: "Sign in to Errby" }),
  ).toBeVisible();
  await page.goto("/");
  await header.getByRole("link", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/setup#sign-up$/);
  await expect(
    page.getByRole("heading", { name: "Sign up for Errby" }),
  ).toBeVisible();
  await expect(
    page.getByText("Self-service sign-up is not available yet.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explore the demo" }).click();
  await expect(page).toHaveURL(/\/learn$/);
});

test("landing explains the teaching loop, navigates, and persists both themes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Teach Errby. Catch its mistakes. Explain your thinking.",
  );
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /Skip to/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();

  const messages = page
    .getByRole("list", { name: "Example conversation" })
    .locator("li");
  await expect(messages).toHaveCount(4);
  await expect(messages.nth(0)).toContainText("Errby");
  await expect(messages.nth(0)).toContainText(
    "Why does ice melt in a warm room?",
  );
  await expect(messages.nth(1)).toContainText("You");
  await expect(messages.nth(2)).toContainText("deliberate mistake");
  await expect(messages.nth(2)).toContainText("So the ice makes its own heat?");
  await expect(messages.nth(3)).toContainText(
    "No. The energy comes from the warmer surroundings.",
  );
  await expect(
    page.getByText("Fictional example · unreviewed", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#example")).not.toContainText("Supervisor");
  await page.getByRole("link", { name: "Explore the teacher plan" }).click();
  await expect(page).toHaveURL(/#teachers$/);
  await expect(page.locator("#teachers")).toContainText(
    "planned and are not available in the current demo",
  );

  const question = page.locator("#questions details").first();
  await expect(question).toHaveAttribute("open", "");
  await question.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(question).not.toHaveAttribute("open");
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("open", "");

  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator(".landing-page")).toHaveCSS(
    "background-color",
    "rgb(18, 23, 34)",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Use light theme" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({
    path: `test-results/landing-dark-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("link", { name: "Learning workspace" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByText("Local demo", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Use light theme" }),
  ).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Use light theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator(".landing-page")).toHaveCSS(
    "background-color",
    "rgb(247, 249, 252)",
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.decode().catch(() => {}),
      ),
    );
  });
  expect(
    await page
      .locator(".landing-page img")
      .evaluateAll((images) =>
        images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
      ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/landing-light-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});

test("landing remains readable at narrow widths, enlarged text and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByText("Example only · no assessment", { exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".landing-page")
      .evaluate((root) =>
        Array.from(root.querySelectorAll("*")).every(
          (element) => getComputedStyle(element).animationName === "none",
        ),
      ),
  ).toBe(true);
});

test("theme control still works when browser storage is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Use light theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
