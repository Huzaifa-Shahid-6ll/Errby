import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { modelRequestKey, requestModel } from "../src/lib/ai/server";

test("model dispatch reserves once, caches usage, refuses unsafe configuration and retains unknown costs", async () => {
  let status = "reserved";
  let fetches = 0;
  let claim = true;
  let settlement: Record<string, unknown> | undefined;
  let savedKey = "";
  const db = {
    async rpc(name: string, args: Record<string, unknown>) {
      if (name === "reserve_model_cost") {
        savedKey = String(args.p_request_key);
        assert.ok(Number(args.p_max_cost) <= 0.03);
        return { data: status };
      }
      if (name === "claim_model_request") return { data: claim };
      settlement = args;
      status = String(args.p_status);
      return { data: status };
    },
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async single() {
                  return {
                    data: {
                      response_json: settlement?.p_response_json,
                      model_id: settlement?.p_model_id,
                      actual_tokens: settlement?.p_tokens,
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  const input = {
    db,
    ownerId: "synthetic-owner",
    requestKey: "synthetic-turn",
    role: "evaluation" as const,
    promptVersion: "test-v1",
    system: "Use the evidence only.",
    input: { text: "Fictional answer" },
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        verified: { type: "boolean" },
        source: {
          oneOf: [{ type: "string", format: "uri" }, { type: "null" }],
        },
      },
      required: ["verified"],
    },
  };
  const dependencies = {
    mode: "live",
    key: "synthetic-not-a-key",
    model: "gpt-4.1-mini",
    fetch: (async (_url: unknown, options: RequestInit) => {
      fetches++;
      const body = JSON.parse(String(options.body));
      assert.equal(body.model, "openai/gpt-4.1-mini");
      assert.equal(body.provider.zdr, true);
      assert.equal(body.provider.data_collection, "deny");
      assert.equal(body.response_format.json_schema.strict, true);
      assert.deepEqual(
        body.response_format.json_schema.schema.properties.source,
        {
          anyOf: [{ type: "string" }, { type: "null" }],
        },
      );
      return Response.json({
        id: "synthetic-response",
        usage: { cost: 0.00002, total_tokens: 100 },
        choices: [
          { finish_reason: "stop", message: { content: '{"verified":false}' } },
        ],
      });
    }) as typeof fetch,
  };
  for (const change of [
    { mode: "demo" },
    { key: "" },
    { model: "different-model" },
  ])
    await assert.rejects(
      requestModel(input, { ...dependencies, ...change }),
      /not configured/,
    );
  await assert.rejects(
    requestModel({ ...input, maxOutputTokens: 6001 }, dependencies),
    /limit/,
  );
  await assert.rejects(
    requestModel({ ...input, input: "x".repeat(100000) }, dependencies),
    /too large/,
  );
  assert.equal(fetches, 0);
  assert.deepEqual((await requestModel(input, dependencies)).output, {
    verified: false,
  });
  const firstKey = savedKey;
  assert.deepEqual((await requestModel(input, dependencies)).output, {
    verified: false,
  });
  assert.equal(fetches, 1);
  assert.equal(savedKey, firstKey);
  status = "reserved";
  claim = false;
  await assert.rejects(requestModel(input, dependencies), /already processing/);
  assert.equal(fetches, 1);
  claim = true;
  settlement = undefined;
  await assert.rejects(
    requestModel(
      { ...input, ownerId: "another-owner" },
      {
        ...dependencies,
        fetch: async () => {
          throw new Error("secret-provider-payload");
        },
      },
    ),
    /needs reconciliation/,
  );
  assert.notEqual(savedKey, firstKey);
  assert.equal(settlement, undefined);
  await assert.rejects(
    requestModel(input, {
      ...dependencies,
      fetch: async () =>
        Response.json({
          id: "synthetic-response",
          usage: { cost: 0.00001, total_tokens: 3 },
          choices: [{ finish_reason: "length", message: { content: "{}" } }],
        }),
    }),
    /usable response/,
  );
  assert.equal(
    (settlement as Record<string, unknown> | undefined)?.p_status,
    "failed",
  );
  status = "reserved";
  await assert.rejects(
    requestModel(input, {
      ...dependencies,
      fetch: async () =>
        Response.json(
          { error: { message: "private-provider-payload" } },
          { status: 400 },
        ),
    }),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      error.code === "model_request_rejected" &&
      !error.message.includes("private-provider"),
  );
  assert.equal(
    (settlement as Record<string, unknown> | undefined)?.p_actual_cost,
    0,
  );
  status = "reserved";
  settlement = undefined;
  await assert.rejects(
    requestModel(input, {
      ...dependencies,
      fetch: async () =>
        Response.json({ error: "unavailable" }, { status: 503 }),
    }),
    /needs reconciliation/,
  );
  assert.equal(settlement, undefined);
  assert.match(modelRequestKey("synthetic"), /^[a-f0-9-]{36}$/);
});
