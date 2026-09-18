import { expect, test } from "@playwright/test";

test("preparation extracts a real fictional PDF and retains topic after network failure", async ({
  page,
}) => {
  const topic = `Grade 7: heat, cells, fractions\n${"x".repeat(2000)}`;
  await page.goto("/prepare");
  await expect(
    page.getByRole("heading", { name: "Prepare your source" }),
  ).toBeVisible();
  await page.getByLabel("Topic or pasted text", { exact: true }).fill(topic);
  const textResponse = page.waitForResponse("**/prepare/extract");
  await page.getByRole("button", { name: "Extract and clarify" }).click();
  expect((await textResponse).status()).toBe(200);
  await expect(
    page.getByText("Which subject is this for?", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Grade or learning level (if known)"),
  ).toHaveValue("Grade 7");
  await expect(
    page.getByText("What grade or learning level should we use?"),
  ).toHaveCount(0);
  await page.getByText("Show all extracted text", { exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.route("**/prepare/extract", (route) => route.abort());
  await page.getByRole("button", { name: "Extract and clarify" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "input and selected file are unchanged",
  );
  await expect(
    page.getByLabel("Topic or pasted text", { exact: true }),
  ).toHaveValue(topic);
  await page.unroute("**/prepare/extract");
  await page.getByLabel("Source type").selectOption("sample");
  const pdfResponse = page.waitForResponse("**/prepare/extract");
  await page.getByRole("button", { name: "Extract and clarify" }).click();
  expect((await pdfResponse).status()).toBe(200);
  await expect(
    page.getByText("Text found on 2 of 2 pages.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Fictional demonstration material/),
  ).toBeVisible();
  await expect(page.locator("pre").first()).toContainText("[Page 1]");
  await expect(page.locator("pre").first()).toContainText("[Page 2]");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Subject (if known)").fill("Science");
  await expect(
    page.getByRole("region", { name: "Extraction result" }),
  ).toHaveCount(0);
});
