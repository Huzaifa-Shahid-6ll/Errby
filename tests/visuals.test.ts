import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  visualSchema,
  linearValue,
  wantsVisual,
} from "../src/lib/visuals/schema";
import { generateVisualReply } from "../src/lib/visuals/server";
import { requestModel } from "../src/lib/ai/server";
import { enterChat, entrySchema } from "../src/lib/chat/entry";
import {
  createPreparation,
  advancePreparation,
  readPreparation,
} from "../src/lib/preparations/service";

const parameters = {
  title: "Explore a straight line",
  caption: "An illustrative example of y = mx + b.",
  slope: 1,
  intercept: 0,
  comparison: null,
};
const visual = {
  ...parameters,
  version: 1 as const,
  kind: "linear_graph" as const,
  id: "00000000-0000-4000-8000-000000000004",
  revision: 0,
};
const input = {
  db: {} as SupabaseClient,
  ownerId: "synthetic-owner",
  requestKey: "synthetic-request",
  message: "Show a graph of a straight line",
};

test("visual descriptors reject unbounded, executable and nonfinite input; line calculation is deterministic", () => {
  assert.equal(visualSchema.safeParse(visual).success, true);
  for (const change of [
    { slope: Infinity },
    { intercept: NaN },
    { slope: 5.1 },
    { intercept: -10.1 },
    { kind: "html" },
    { html: "<script>run()</script>" },
    { revision: -1 },
    { version: 2 },
    { title: "x".repeat(101) },
    { comparison: { slope: 0, intercept: 11 } },
  ])
    assert.equal(
      visualSchema.safeParse({ ...visual, ...change }).success,
      false,
    );
  assert.equal(linearValue(-2, 3, 4), -5);
  assert.equal(linearValue(0, -10, -10), -10);
  assert.equal(wantsVisual("Can you plot this?"), true);
  assert.equal(wantsVisual("Make the slope negative", visual), true);
  assert.equal(wantsVisual("Hello"), false);
});

test("structured visual generation owns identity and revisions, bounds output and preserves selected controls", async () => {
  const generate = (async (request) => {
    assert.equal(request.maxOutputTokens, 800);
    assert.equal(
      request.onText,
      undefined,
      "unvalidated visual output must not stream",
    );
    assert.match(request.system, /illustrative/);
    return {
      output: {
        text: "What changes as you move the slope?",
        visual: parameters,
      },
      model: "mock",
      tokens: 0,
    };
  }) as typeof requestModel;
  const first = await generateVisualReply(input, generate);
  assert.ok(first.visual);
  assert.equal(first.visual.revision, 0);
  const retry = await generateVisualReply(input, generate);
  assert.deepEqual(
    first,
    retry,
    "same request restores the same surface identity",
  );
  const next = await generateVisualReply(
    { ...input, current_visual: { ...first.visual, slope: 3 } },
    async (request) => {
      assert.equal(
        (request.input as { current_visual: typeof visual }).current_visual
          .slope,
        3,
      );
      return {
        output: {
          text: "How do these slopes compare?",
          visual: { ...parameters, comparison: { slope: -1, intercept: 0 } },
        },
        model: "mock",
        tokens: 0,
      };
    },
  );
  assert.equal(next.visual?.id, first.visual.id);
  assert.equal(next.visual?.revision, 1);
  assert.equal(next.visual?.comparison?.slope, -1);
  for (const output of [
    {
      text: "Here is HTML",
      visual: { ...parameters, html: "<script>run()</script>" },
    },
    { text: "Bad bounds", visual: { ...parameters, slope: 100 } },
    { text: "", visual: parameters },
  ]) {
    const fallback = await generateVisualReply(input, async () => ({
      output,
      model: "mock",
      tokens: 0,
    }));
    assert.equal(fallback.visual, undefined);
    assert.match(fallback.text, /couldn't safely/);
  }
  const text = await generateVisualReply(input, async () => ({
    output: {
      text: "This tool supports straight lines. What line shall we explore?",
      visual: null,
    },
    model: "mock",
    tokens: 0,
  }));
  assert.equal(text.visual, undefined);
  const stop = new AbortController();
  await assert.rejects(
    generateVisualReply({ ...input, signal: stop.signal }, async () => {
      stop.abort();
      return {
        output: { text: "Too late", visual: parameters },
        model: "mock",
        tokens: 0,
      };
    }),
    /abort/i,
  );
});

test("opening visual result is atomic and explicit requests accept validated current state", async () => {
  const entry = {
    key: visual.id,
    text: "Show a negative slope",
    notes: false,
    history: [
      { role: "student" as const, text: "Let's explore a straight line." },
    ],
    visual_request: true,
    current_visual: visual,
  };
  assert.equal(entrySchema.safeParse(entry).success, true);
  assert.equal(
    entrySchema.safeParse({
      ...entry,
      current_visual: { ...visual, slope: 50 },
    }).success,
    false,
  );
  const events: unknown[] = [];
  const result = await enterChat(
    input.db,
    { id: input.ownerId, role: "learner", grade: "" },
    entry,
    {
      createPreparation,
      advancePreparation,
      readPreparation,
      requestModel: async (request) => {
        assert.deepEqual(
          (request.input as { conversation: unknown }).conversation,
          entry.history,
        );
        return {
          output: {
            text: "How does this line change?",
            visual: { ...parameters, slope: -1 },
          },
          model: "mock",
          tokens: 0,
        };
      },
    },
    (event) => events.push(event),
  );
  assert.equal(result.visual?.slope, -1);
  assert.equal(result.visual?.id, visual.id);
  assert.deepEqual(events, [{ type: "status", message: "Errby is thinking…" }]);
});
