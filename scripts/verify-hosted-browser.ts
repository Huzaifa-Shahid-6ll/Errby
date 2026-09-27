import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { chromium, expect, type Page } from "@playwright/test";

// Run against a separately started live local server; no traces or cookie files.
// node --env-file=.env.local --env-file=.env.hackathon --import tsx scripts/verify-hosted-browser.ts
const required = (name: string) => {
  const value = process.env[name];
  assert(value, `Missing ${name}`);
  return value;
};
assert.equal(process.env.ERRBY_OPERATOR_CONFIRM, "synthetic-test-project");
const baseURL = process.env.HACKATHON_BASE_URL ?? "http://127.0.0.1:3100";
assert(["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname));
const browser = await chromium.launch();
const save = (name: string, value: string) => {
  appendFileSync(".env.hackathon", `${name}=${JSON.stringify(value)}\n`);
  process.env[name] = value;
};
async function readJson(page: Page, url: string, expected = 200) {
  // Browser fetch preserves Chromium's secure-loopback cookie behavior in production.
  const response = await page.evaluate(async (url) => {
    const result = await fetch(url);
    return { status: result.status, data: await result.json() };
  }, url);
  assert.equal(response.status, expected, "Browser API read failed");
  return response.data;
}
let stage = "launch";
let checks = 0;
async function login(page: Page, prefix: string) {
  stage = `${prefix} sign in`;
  await page.goto(`${baseURL}/setup`);
  await page
    .getByLabel("Student username or teacher email")
    .fill(
      required(
        `HACKATHON_${prefix}_${prefix === "TEACHER" ? "EMAIL" : "USERNAME"}`,
      ),
    );
  await page
    .getByLabel("Password", { exact: true })
    .fill(required(`HACKATHON_${prefix}_PASSWORD`));
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`${baseURL}/learn`, { timeout: 90_000 });
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
  const cookies = await page.context().cookies();
  assert(
    cookies.some(
      (cookie) => cookie.name.includes("auth-token") && cookie.httpOnly,
    ),
    "Auth cookie missing or exposed to scripts",
  );
  checks += 3;
}
try {
  const teacher = await browser.newContext();
  teacher.setDefaultTimeout(90_000);
  const teacherPage = await teacher.newPage();
  await login(teacherPage, "TEACHER");
  stage = "teacher class navigation";
  await teacherPage
    .getByRole("link", { name: "Your classes", exact: true })
    .click();
  await expect(
    teacherPage.getByText("Synthetic Hackathon Class", { exact: true }),
  ).toBeVisible();
  await expect(
    teacherPage
      .getByRole("link", { name: "Prepare lesson", exact: true })
      .first(),
  ).toBeVisible();
  checks += 2;

  stage = "synthetic class preparation";
  if (!process.env.HACKATHON_PREPARATION_ID) {
    await teacherPage.goto(
      `${baseURL}/prepare?class_id=${required("HACKATHON_CLASS_ID")}`,
    );
    await teacherPage.getByLabel("Source type").selectOption("text");
    await teacherPage
      .getByLabel("Topic or pasted text", { exact: true })
      .fill(
        "Synthetic practice source for adult software testing. Heat transfers from a warmer object to a cooler object. In a warm room, energy transfers from the room into colder ice. Insulation slows heat transfer; it does not create cold. A wrapped ice cube melts more slowly because less energy reaches it each second. During melting of pure ice at constant pressure, added energy changes solid ice into liquid water while its temperature stays constant until all the ice melts.",
      );
    await teacherPage
      .getByLabel("Subject (if known)", { exact: true })
      .fill("Science");
    await teacherPage
      .getByLabel("Grade or learning level (if known)", { exact: true })
      .fill("middle_school");
    await teacherPage
      .getByLabel("Learning scope or desired depth (if known)", { exact: true })
      .fill(
        "Synthetic adult software verification: explain heat direction, insulation and melting",
      );
    await teacherPage
      .getByRole("button", {
        name: "Extract and save preparation",
        exact: true,
      })
      .click();
    await teacherPage.waitForURL(/\/prepare\/[a-f0-9-]+$/);
    save("HACKATHON_PREPARATION_ID", teacherPage.url().split("/").at(-1)!);
  } else
    await teacherPage.goto(
      `${baseURL}/prepare/${required("HACKATHON_PREPARATION_ID")}`,
    );
  const preparationPath = `${baseURL}/api/preparations/${required("HACKATHON_PREPARATION_ID")}`;
  let preparation = await readJson(teacherPage, preparationPath);
  if (!preparation.lesson) {
    stage = "real class lesson generation";
    await teacherPage
      .getByRole("button", { name: "Generate lesson draft", exact: true })
      .click();
    await expect(
      teacherPage.getByRole("heading", {
        name: "Teacher draft map and review",
        exact: true,
      }),
    ).toBeVisible({ timeout: 150_000 });
    preparation = await readJson(teacherPage, preparationPath);
  }
  if (preparation.review_status === "needs_review") {
    stage = "automated synthetic review action (not human content acceptance)";
    await teacherPage
      .getByLabel("Lesson title", { exact: true })
      .fill("Synthetic adult software verification: heat");
    for (const finding of await teacherPage.getByLabel("Review finding").all())
      await finding.selectOption("source_checked");
    const edit = teacherPage.getByRole("button", {
      name: "Save edited draft as next version",
      exact: true,
    });
    if (await edit.isEnabled()) {
      await edit.click();
      await expect(edit).toBeDisabled();
    }
    await teacherPage
      .getByRole("button", {
        name: "Approve current saved version after review",
        exact: true,
      })
      .click();
    await expect(
      teacherPage.getByLabel("Publish this approved version to the class", {
        exact: true,
      }),
    ).toBeVisible();
  }
  preparation = await readJson(teacherPage, preparationPath);
  if (preparation.review_status === "approved") {
    stage = "publish synthetic class version";
    await teacherPage
      .getByLabel("Publish this approved version to the class", { exact: true })
      .check();
    await teacherPage
      .getByRole("button", { name: "Publish class lesson", exact: true })
      .click();
    await expect(
      teacherPage.getByRole("button", {
        name: "Publish class lesson",
        exact: true,
      }),
    ).toHaveCount(0);
  }
  preparation = await readJson(teacherPage, preparationPath);
  assert.equal(preparation.review_status, "published");
  save(
    "HACKATHON_VERSION_ID",
    preparation.job.partial_results.lesson_version_id,
  );
  checks += 4;

  const learner = await browser.newContext({
    viewport: { width: 360, height: 800 },
  });
  learner.setDefaultTimeout(90_000);
  const learnerPage = await learner.newPage();
  await login(learnerPage, "LEARNER");
  stage = "learner class preview and confirmation";
  await learnerPage
    .getByRole("link", { name: "Your classes", exact: true })
    .click();
  await learnerPage
    .getByLabel("Class code", { exact: true })
    .fill(required("HACKATHON_CLASS_CODE"));
  await learnerPage
    .getByRole("button", { name: "Check code", exact: true })
    .click();
  await expect(
    learnerPage.getByText("Teacher: Synthetic Hackathon Teacher", {
      exact: true,
    }),
  ).toBeVisible();
  await learnerPage
    .getByRole("button", { name: "Confirm join", exact: true })
    .click();
  await expect(learnerPage.getByRole("status")).toContainText(
    "Joined Synthetic Hackathon Class.",
  );
  checks += 2;
  if (!process.env.HACKATHON_SESSION_ID) {
    stage = "start published class lesson";
    await learnerPage.goto(`${baseURL}/learn`);
    await learnerPage
      .getByRole("button", {
        name: "Start session: Synthetic adult software verification: heat",
        exact: true,
      })
      .click();
    await learnerPage.waitForURL(/\/learn\/sessions\/[a-f0-9-]+$/);
    save("HACKATHON_SESSION_ID", learnerPage.url().split("/").at(-1)!);
  }
  const sessionId = required("HACKATHON_SESSION_ID");
  await learnerPage.goto(`${baseURL}/learn/sessions/${sessionId}`);
  const current = await readJson(
    learnerPage,
    `${baseURL}/api/sessions/${sessionId}`,
  );
  if (current.session.last_sequence === 0) {
    stage = "real learner answer evaluation";
    await learnerPage
      .getByLabel("Your explanation", { exact: true })
      .fill(
        "A warmer room passes energy into the cooler ice. An insulating wrapper slows that transfer, so the cube takes longer to melt; it does not make cold. When pure ice melts at fixed pressure, incoming energy changes the solid into liquid instead of raising its temperature until melting finishes.",
      );
    await learnerPage
      .getByRole("button", { name: "Send answer", exact: true })
      .click();
    await expect(
      learnerPage.getByText("Completed", { exact: true }),
    ).toBeVisible({ timeout: 150_000 });
  }
  stage = "learner saved session and results";
  await learnerPage.goto(`${baseURL}/learn/sessions/${sessionId}`);
  await expect(
    learnerPage.getByRole("button", {
      name: "Refresh saved session",
      exact: true,
    }),
  ).toBeVisible();
  await learnerPage
    .getByRole("button", { name: "Refresh saved session", exact: true })
    .click();
  await expect(
    learnerPage.getByRole("button", {
      name: "Refresh saved session",
      exact: true,
    }),
  ).toBeEnabled();
  assert(
    await learnerPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Phone session overflow",
  );
  await learnerPage.goto(`${baseURL}/learn/sessions/${sessionId}/results`);
  await expect(
    learnerPage.getByRole("heading", { name: "Session results", exact: true }),
  ).toBeVisible();
  await expect(
    learnerPage.getByText(/You explained \d+ of \d+ required goals/),
  ).toBeVisible();
  assert(
    await learnerPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Phone results overflow",
  );
  checks += 5;
  stage = "teacher scoped results";
  await teacherPage.goto(
    `${baseURL}/classes/${required("HACKATHON_CLASS_ID")}/results?version=${required("HACKATHON_VERSION_ID")}`,
  );
  await expect(
    teacherPage.getByRole("heading", { name: "Class results", exact: true }),
  ).toBeVisible();
  await expect(teacherPage.getByText(/Class first-try average:/)).toBeVisible();
  checks += 2;
  stage = "outsider session and result denial";
  const outsider = await browser.newContext();
  outsider.setDefaultTimeout(90_000);
  const otherPage = await outsider.newPage();
  await login(otherPage, "OTHER");
  await readJson(otherPage, `${baseURL}/api/sessions/${sessionId}`, 404);
  await otherPage.goto(`${baseURL}/learn/sessions/${sessionId}/results`);
  await expect(
    otherPage.getByText("Results are unavailable for this account or session."),
  ).toBeVisible();
  checks += 2;
  stage = "browser sign out";
  await learnerPage.goto(`${baseURL}/setup`);
  await learnerPage
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await learnerPage.waitForURL(`${baseURL}/setup`);
  await expect(
    learnerPage.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  checks++;
  console.log(
    JSON.stringify({
      checksPassed: checks,
      scope: "real browser cookies, classes, saved session and scoped results",
      realProviderFlow: true,
    }),
  );
} catch (error) {
  let detail = error instanceof Error ? error.message : "Unknown failure";
  for (const [name, value] of Object.entries(process.env)) {
    if (
      /PASSWORD|KEY|TOKEN|EMAIL|CODE|URL/.test(name) &&
      value &&
      value.length > 5
    )
      detail = detail.replaceAll(value, "[redacted]");
  }
  console.error(detail.slice(0, 2000));
  console.error(
    `Hosted browser verification failed during: ${stage}. Credentials and page contents were not logged.`,
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
