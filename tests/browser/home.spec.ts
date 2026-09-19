import { expect, test } from "@playwright/test";

test("fictional lessons, retained composer, theme and responsive width", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/learn");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "What are you teaching",
  );
  await expect(page.getByText("Local demo", { exact: true })).toBeVisible();
  await page
    .getByLabel("Your topic or learning material")
    .fill("Equivalent fractions");
  const examples = page.getByRole("list", { name: "Fictional class lessons" });
  await expect(examples.getByRole("article")).toHaveCount(2);
  const open = page.getByRole("button", {
    name: "Open example: Why does ice melt?",
    exact: true,
  });
  await open.click();
  await expect(page.locator("#example-title")).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Supervisor", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Example objectives only · no learner evidence or progress"),
  ).toBeVisible();
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
  await expect(open).toBeFocused();
  expect(errors).toEqual([]);
});

test("keyboard skip, sidebar and example focus return", async ({ page }) => {
  await page.goto("/learn");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to learning space" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  const lessonsLink = page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Lessons" });
  await lessonsLink.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#lessons")).toBeFocused();
  const open = page.getByRole("button", { name: /^Open example:/ }).last();
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#example-title")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close example" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(open).toBeFocused();
});

test("empty and pending fixtures remain honest at enlarged text and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/learn");
  await page
    .getByLabel("Your topic or learning material")
    .fill("x".repeat(2_000));
  const scenario = page.getByLabel("Preview scenario");
  await scenario.selectOption("new");
  await expect(
    page.getByRole("heading", { name: "No class lessons yet" }),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Fictional class lessons" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Choose a topic" }).click();
  await expect(
    page.getByLabel("Your topic or learning material"),
  ).toBeFocused();
  await scenario.selectOption("preparing");
  await expect(
    page.getByText(/No background job is running for this fixture/),
  ).toBeVisible();
  await scenario.selectOption("returning");
  await expect(
    page.getByText(/No saved learning sessions in this demo/),
  ).toBeVisible();
  await page.addStyleTag({
    content: "html { font-size: 200%; } body { font-size: 200%; }",
  });
  await page
    .locator(".lesson-copy h3")
    .first()
    .evaluate((element) => {
      element.textContent = "LongFictionalTitle".repeat(30);
    });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await page.screenshot({
    path: `test-results/home-accessibility-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("composer rejects whitespace and passes draft privately to preparation", async ({
  page,
}) => {
  await page.goto("/learn");
  const topic = page.getByLabel("Your topic or learning material");
  await topic.fill("   ");
  await page
    .getByRole("button", { name: "Prepare lesson", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Enter a topic");
  await expect(topic).toBeFocused();
  const draft = "Fictional draft: Equivalent fractions, grade 7";
  await topic.fill(draft);
  await page
    .getByRole("button", { name: "Prepare lesson", exact: true })
    .click();
  await expect(page).toHaveURL(/\/prepare$/);
  await expect(
    page.getByRole("textbox", { name: "Topic or pasted text" }),
  ).toHaveValue(draft);
  const stored = await page.evaluate(() => ({
    local: Object.values(localStorage),
    session: Object.values(sessionStorage),
  }));
  expect(JSON.stringify(stored)).not.toContain(draft);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Topic or pasted text" }),
  ).toHaveValue("");
  await page.goto("/learn");
  await page.getByRole("button", { name: "Add material" }).click();
  await expect(page).toHaveURL(/\/prepare$/);
  await expect(page.getByLabel("Source type")).toBeVisible();
});
