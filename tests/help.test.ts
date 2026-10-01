import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleSessionHelp } from "../src/lib/sessions/help";
import type { SessionState } from "../src/lib/sessions/contracts";
import { IngestionError } from "../src/lib/ingestion/server";

test("simpler wording is owner checked, sequence pinned, retry cached and never assessed", async () => {
  const id = "00000000-0000-4000-8000-000000000111";
  const state: SessionState = {
    session: {
      id,
      status: "awaiting_student",
      last_sequence: 0,
      visibility: "private",
      opened_at: "2026-10-01T00:00:00Z",
      lesson_title: "Fictional",
      objective_labels: [],
    },
    messages: [
      {
        id: "question",
        sequence: 0,
        role: "errby",
        text: "Could you explain your idea?",
        created_at: "2026-10-01T00:00:00Z",
      },
    ],
  };
  let reads = 0;
  let calls = 0;
  const keys: string[] = [];
  const db = new Proxy(
    {},
    {
      get() {
        throw new Error("Help must not mutate evidence or submit an answer");
      },
    },
  ) as SupabaseClient;
  const access = async () => ({ db, actor: { id, role: "learner" as const } });
  const request = (origin = "http://localhost", expected_sequence = 0) =>
    new Request("http://localhost/api/sessions/" + id + "/help", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ expected_sequence }),
    });
  const dependencies: NonNullable<Parameters<typeof handleSessionHelp>[3]> = {
    getSession: async () => {
      reads++;
      return structuredClone(state);
    },
    requestModel: async (input) => {
      calls++;
      keys.push(input.requestKey);
      assert.deepEqual(input.input, { question: state.messages[0].text });
      assert.equal(input.ownerId, id);
      return {
        output: { question: "What do you mean?" },
        model: "mock",
        tokens: 1,
      };
    },
  };
  for (let i = 0; i < 2; i++) {
    const response = await handleSessionHelp(
      request(),
      access,
      id,
      dependencies,
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), {
      question: "What do you mean?",
      sequence: 0,
    });
  }
  assert.equal(
    keys[0],
    keys[1],
    "same question uses the provider's exact replay key",
  );
  assert.equal(reads, 4, "recheck access and sequence after the model");
  assert.equal(
    (
      await handleSessionHelp(
        request("https://foreign.invalid"),
        access,
        id,
        dependencies,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleSessionHelp(
        request(),
        async () => {
          throw new IngestionError("unauthenticated", "Sign in", 401);
        },
        id,
        dependencies,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handleSessionHelp(
        request("http://localhost", 1),
        access,
        id,
        dependencies,
      )
    ).status,
    409,
  );
  state.session.status = "completed";
  assert.equal(
    (await handleSessionHelp(request(), access, id, dependencies)).status,
    409,
  );
  assert.equal(calls, 2, "rejected requests spend nothing");
  state.session.status = "awaiting_student";
  const moved = await handleSessionHelp(request(), access, id, {
    ...dependencies,
    requestModel: async (...args) => {
      const result = await dependencies.requestModel(...args);
      state.session.last_sequence = 2;
      return result;
    },
  });
  assert.equal(moved.status, 409, "never display a stale helper question");
  state.session.last_sequence = 0;
  state.messages[0].role = "supervisor";
  state.messages[0].text =
    "Heat moves from warmer to cooler objects. Why does an insulated box slow melting? You can pause and come back.";
  const correction = await handleSessionHelp(request(), access, id, {
    ...dependencies,
    requestModel: async (input) => {
      assert.deepEqual(
        input.input,
        { question: "Why does an insulated box slow melting?" },
        "simplification receives no supplied correction or pause wording",
      );
      assert.ok(input.signal);
      return {
        output: { question: "Why does the box slow melting?" },
        model: "mock",
        tokens: 1,
      };
    },
  });
  assert.equal(correction.status, 200);
  state.messages[0].text = "Heat moves from warmer to cooler objects.";
  assert.equal(
    (
      await handleSessionHelp(request(), access, id, {
        ...dependencies,
        requestModel: async () => {
          assert.fail("Never reword a correction as a question");
        },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await handleSessionHelp(request(), access, id, {
        ...dependencies,
        getSession: async () => {
          throw new IngestionError(
            "session_forbidden",
            "Not your conversation",
            403,
          );
        },
        requestModel: async () => {
          assert.fail("No provider call after access denial");
        },
      })
    ).status,
    403,
  );
});
