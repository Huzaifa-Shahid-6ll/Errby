import { expect, test } from "@playwright/test";

test("source starter previews its evidence and fills editable notes without submitting", async ({
  page,
}) => {
  let modelRequests = 0;
  await page.route("**/api/chat", async (route) => {
    modelRequests++;
    await route.fulfill({
      status: 503,
      json: { error: "Fictional browser test: no model call allowed." },
    });
  });
  await page.goto("/learn");
  await page
    .getByRole("button", { name: "How heat moves", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(
    "Convection is the transfer of heat energy in a fluid.",
  );
  await expect(
    dialog.getByRole("link", { name: /Read NOAA JetStream/ }),
  ).toHaveAttribute(
    "href",
    "https://www.noaa.gov/jetstream/atmosphere/transfer-of-heat-energy",
  );
  await expect(dialog).toContainText("Nothing is sent until you choose Send.");
  await expect(
    dialog.getByRole("region", { name: "Reference note" }),
  ).toContainText("Errby summary");
  await expect(dialog.locator('figure[data-kind="source"]')).toContainText(
    "Source excerpt",
  );
  await expect(dialog.locator(".chat-resource-link svg")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.fontSize = "24px";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog
    .getByRole("button", { name: "Use these reference notes" })
    .click();
  await expect(dialog).not.toBeVisible();
  const notes = page.getByRole("textbox", { name: "Paste reference notes" });
  await expect(notes).toHaveValue(/Reference notes \(Errby summary\)/);
  await expect(notes).toHaveValue(
    /https:\/\/www\.noaa\.gov\/jetstream\/atmosphere\/transfer-of-heat-energy/,
  );
  await notes.fill("My edited reference notes");
  await expect(notes).toHaveValue("My edited reference notes");
  expect(modelRequests).toBe(0);
});

test("source starter leaves an existing draft intact until replacement is explicit", async ({
  page,
}) => {
  await page.goto("/learn");
  const composer = page.getByRole("textbox", { name: "Message Errby" });
  await composer.fill("Keep my fictional original draft.");
  await page
    .getByRole("button", { name: "Equivalent fractions", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Archived NASA reference");
  await dialog
    .getByRole("button", { name: "Use these reference notes" })
    .click();
  await expect(composer).toHaveValue("Keep my fictional original draft.");
  await page
    .getByRole("button", {
      name: "Replace draft with source notes",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Paste reference notes" }),
  ).toHaveValue(/Equivalent fractions/);
});
