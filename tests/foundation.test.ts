import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parseEnv } from "../src/lib/env/schema";

test("demo needs no secrets; invalid/live configuration fails without leaking values", () => {
  assert.equal(parseEnv({}).ERRBY_MODE, "demo");
  assert.throws(() => parseEnv({ ERRBY_MODE: "typo" }), /ERRBY_MODE/);
  assert.throws(() => parseEnv({ ERRBY_MODE: "live" }), /SUPABASE_URL/);
  assert.throws(
    () =>
      parseEnv({
        ERRBY_MODE: "live",
        SUPABASE_URL: "secret-value",
        SUPABASE_PUBLISHABLE_KEY: "placeholder",
      }),
    (error: unknown) =>
      error instanceof Error && !error.message.includes("secret-value"),
  );
});

test("supplied unreviewed fixture stays unverified with no fabricated references", () => {
  const lesson = JSON.parse(
    readFileSync("docs/specification/EXAMPLE_LESSON.json", "utf8"),
  );
  assert.equal(lesson.illustrative_only, true);
  assert.equal(lesson.teacher_review.reviewed, false);
  assert.equal(lesson.reference_status, "unverified_until_review");
});

test("implemented light/dark tokens exactly match the authoritative palette", () => {
  const palette = JSON.parse(
    readFileSync("docs/visual-design/palette-tokens.json", "utf8"),
  );
  const css = readFileSync("src/app/globals.css", "utf8").toLowerCase();
  for (const [theme, tokens] of Object.entries(palette)) {
    const selector = theme === "light" ? ":root" : ".dark";
    const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
    for (const [name, value] of Object.entries(
      tokens as Record<string, string>,
    )) {
      assert.ok(
        block.includes(
          `--${name.replaceAll("_", "-")}: ${value.toLowerCase()};`,
        ),
        `${theme}.${name}`,
      );
    }
  }
});
