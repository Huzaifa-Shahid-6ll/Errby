import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { enterChat, entrySchema } from "../src/lib/chat/entry";
import { requestModel } from "../src/lib/ai/server";
import { IngestionError } from "../src/lib/ingestion/server";
import {
  createPreparation,
  advancePreparation,
  readPreparation,
} from "../src/lib/preparations/service";

const actor = {
  id: "00000000-0000-4000-8000-000000000003",
  role: "learner" as const,
  grade: "",
};
const input = {
  key: "00000000-0000-4000-8000-000000000004",
  text: "Hello",
  notes: false,
  history: [],
};
test("chat entry is ungraded, bounded and retains the student-teaches-Errby role", async () => {
  let calls = 0;
  const dependencies = {
    createPreparation,
    advancePreparation,
    readPreparation,
    requestModel: (async (request) => {
      calls++;
      assert.equal(request.role, "errby");
      assert.match(request.system, /student teaches YOU/);
      assert.match(request.system, /Do not lecture, claim correctness, grade/);
      assert.equal(request.requestKey, `${input.key}:chat-entry`);
      return {
        output: { text: "Hello! What would you like to teach me?" },
        model: "mock",
        tokens: 0,
      };
    }) as typeof requestModel,
  };
  const db = {} as SupabaseClient;
  assert.deepEqual(await enterChat(db, actor, input, dependencies), {
    reply: "Hello! What would you like to teach me?",
  });
  await assert.rejects(
    enterChat(db, { ...actor, role: "teacher" }, input, dependencies),
    /student account/,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    enterChat(db, actor, input, {
      ...dependencies,
      requestModel: async () => {
        throw new IngestionError(
          "model_unavailable",
          "Your work is saved.",
          503,
        );
      },
    }),
    (error: unknown) =>
      error instanceof Error &&
      error.message.includes("browser tab") &&
      !error.message.includes("work is saved"),
  );
  assert.equal(entrySchema.safeParse({ ...input, text: " " }).success, false);
  assert.equal(
    entrySchema.safeParse({ ...input, text: "x".repeat(8001) }).success,
    false,
  );
  await assert.rejects(
    enterChat(db, actor, input, {
      ...dependencies,
      requestModel: async () => ({
        output: { text: "" },
        model: "mock",
        tokens: 0,
      }),
    }),
    /could not finish/,
  );
});

test("notes reuse private preparation and ready session handoff; incomplete evidence never starts a session", async () => {
  const calls: string[] = [];
  const job = {
    id: input.key,
    current_step: 0,
    partial_results: { lesson_version_id: input.key },
  };
  let ready = true;
  const state = () => ({
    job: { ...job },
    review_status: ready && job.current_step === 2 ? "private_ready" : "draft",
    lesson: null,
    can_author: false,
  });
  const dependencies = {
    requestModel: async () => {
      throw new Error("Entry model must not be called for notes");
    },
    createPreparation: async (
      ...args: Parameters<typeof createPreparation>
    ) => {
      assert.equal(args[3], null);
      assert.equal(args[4].extraction.source_role, "evidence");
      calls.push("save");
      return job;
    },
    readPreparation: async () => state(),
    advancePreparation: async (
      _db: unknown,
      _actor: unknown,
      _id: unknown,
      value: { expected_step: number },
    ) => {
      assert.equal(value.expected_step, job.current_step);
      calls.push(`step${job.current_step}`);
      job.current_step++;
      return state();
    },
  } as unknown as Parameters<typeof enterChat>[3];
  const db = {
    rpc: async (name: string) => {
      calls.push(name);
      return { data: input.key, error: null };
    },
  } as unknown as SupabaseClient;
  assert.deepEqual(
    await enterChat(
      db,
      actor,
      {
        ...input,
        notes: true,
        text: "Heat transfers from warmer objects to colder objects.",
      },
      dependencies,
    ),
    { session_id: input.key },
  );
  assert.deepEqual(calls, ["save", "step0", "step1", "open_private_chat"]);
  calls.length = 0;
  await enterChat(db, actor, { ...input, notes: true }, dependencies);
  assert.deepEqual(calls, ["save", "open_private_chat"]);
  ready = false;
  calls.length = 0;
  const result = await enterChat(
    db,
    actor,
    { ...input, notes: true },
    dependencies,
  );
  assert.match(result.reply!, /no progress has been awarded/);
  assert.deepEqual(calls, ["save"]);

  const stop = new AbortController();
  calls.length = 0;
  job.current_step = 0;
  await assert.rejects(
    enterChat(
      db,
      actor,
      { ...input, notes: true },
      {
        ...dependencies!,
        advancePreparation: async (
          ...args: Parameters<typeof advancePreparation>
        ) => {
          assert.equal(args[5], stop.signal);
          calls.push("saved-step0");
          job.current_step++;
          stop.abort();
          return state() as Awaited<ReturnType<typeof advancePreparation>>;
        },
      },
      undefined,
      stop.signal,
    ),
    /abort/i,
  );
  assert.deepEqual(
    calls,
    ["save", "saved-step0"],
    "stopping notes retains the saved step and skips generation/opening",
  );
});
