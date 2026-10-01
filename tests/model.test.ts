import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { modelRequestKey, requestModel } from "../src/lib/ai/server";
import { readReply, readEvents } from "../src/lib/http/event-stream";
import { streamResponse } from "../src/lib/http/stream-response";

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

test("OpenRouter streams split UTF-8 events, settles final usage, replays and keeps interrupted costs reserved", async () => {
  let settlement: Record<string, unknown> | undefined;
  let replay = false;
  const db = {
    async rpc(name: string, args: Record<string, unknown>) {
      if (name === "reserve_model_cost")
        return { data: replay ? "succeeded" : "reserved" };
      if (name === "claim_model_request") return { data: true };
      settlement = args;
      return { data: true };
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              response_json: settlement?.p_response_json,
              model_id: "openai/gpt-4.1-mini",
              actual_tokens: 9,
            },
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
  const deltas: string[] = [];
  const input = {
    db,
    ownerId: "synthetic",
    requestKey: "stream",
    role: "errby" as const,
    promptVersion: "test",
    system: "Fictional test",
    input: "Hi",
    schema: {},
    maxOutputTokens: 400,
    onText: (text: string) => deltas.push(text),
  };
  const frame = (data: unknown) => `data: ${JSON.stringify(data)}\r\n\r\n`;
  const prefix =
    ": heartbeat\r\n\r\n" +
    frame({
      id: "mock",
      choices: [{ delta: { content: "Why 🧊" }, finish_reason: null }],
    });
  const ending =
    frame({
      id: "mock",
      choices: [{ delta: { content: " melts?" }, finish_reason: "stop" }],
    }) +
    frame({
      id: "mock",
      choices: [{ delta: { content: "" }, finish_reason: "stop" }],
      usage: { cost: 0.00001, total_tokens: 9 },
    });
  let wire = prefix + ending + "data: [DONE]\r\n\r\n";
  let calls = 0;
  const dependencies = {
    mode: "live",
    key: "mock",
    model: "gpt-4.1-mini",
    fetch: (async (_url: unknown, options: RequestInit) => {
      calls++;
      const body = JSON.parse(String(options.body));
      assert.equal(body.stream, true);
      assert.equal(body.response_format, undefined);
      return new Response(
        new ReadableStream({
          start(controller) {
            // One byte at a time deliberately splits emoji and JSON framing.
            for (const byte of new TextEncoder().encode(wire))
              controller.enqueue(new Uint8Array([byte]));
            controller.close();
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      );
    }) as typeof fetch,
  };
  assert.deepEqual((await requestModel(input, dependencies)).output, {
    text: "Why 🧊 melts?",
  });
  assert.equal(deltas.join(""), "Why 🧊 melts?");
  assert.equal(settlement?.p_status, "succeeded");
  assert.equal(settlement?.p_actual_cost, 0.00001);
  replay = true;
  assert.deepEqual((await requestModel(input, dependencies)).output, {
    text: "Why 🧊 melts?",
  });
  assert.equal(calls, 1);
  replay = false;
  for (const incomplete of [
    prefix,
    prefix + ending,
    prefix + frame({ error: { message: "private provider error" } }),
  ]) {
    settlement = undefined;
    wire = incomplete;
    await assert.rejects(
      requestModel(input, dependencies),
      /needs reconciliation/,
    );
    assert.equal(settlement, undefined);
  }
  await assert.rejects(
    requestModel({ ...input, role: "evaluation" }, dependencies),
    /cannot stream/,
  );
});

test("application stream delivers progress before completion, rejects missing results and settles after disconnect", async () => {
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let settled = false;
  const response = streamResponse(async (emit) => {
    emit({ type: "status", message: "Reading notes…" });
    await gate;
    settled = true;
    return { reply: "Fictional result" };
  });
  const reader = response.body!.getReader();
  assert.match(
    new TextDecoder().decode((await reader.read()).value),
    /Reading notes/,
  );
  assert.equal(settled, false);
  await reader.cancel();
  finish();
  await gate;
  assert.equal(settled, true);
  const progress: string[] = [];
  const completed = streamResponse(async (emit) => {
    emit({ type: "delta", text: "Hi" });
    return { reply: "Hi" };
  });
  assert.deepEqual(
    await readReply(completed, (event) => {
      if (event.type === "delta") progress.push(event.text);
    }),
    { reply: "Hi" },
  );
  assert.deepEqual(progress, ["Hi"]);
  await assert.rejects(
    readReply(
      new Response('data: {"type":"delta","text":"Partial"}\n\n', {
        headers: { "content-type": "text/event-stream" },
      }),
      () => {},
    ),
    /couldn't be confirmed/,
  );
  await assert.rejects(async () => {
    for await (const event of readEvents(new Response('data: {"x":').body!))
      void event;
  }, /Incomplete/);
  await assert.rejects(
    readReply(
      streamResponse(async () => {
        throw new Error("private secret");
      }),
      () => {},
    ),
    (error: unknown) =>
      error instanceof Error && !error.message.includes("private secret"),
  );
});

test("Stop propagates through the response to provider reads, retains uncertain spend and prevents redispatch", async () => {
  let status = "reserved";
  let fetches = 0;
  let providerSignal: AbortSignal | undefined;
  let cancelledBody = false;
  const db = {
    async rpc(name: string) {
      if (name === "reserve_model_cost") return { data: status };
      if (name === "claim_model_request") {
        status = "pending";
        return { data: true };
      }
      assert.fail(
        "Interrupted provider cost must not be released or settled as successful",
      );
    },
  } as unknown as SupabaseClient;
  const input = {
    db,
    ownerId: "synthetic",
    requestKey: "cancelled",
    role: "errby" as const,
    promptVersion: "test",
    system: "Fictional",
    input: "Hi",
    schema: {},
  };
  const dependencies = {
    mode: "live",
    key: "mock",
    model: "gpt-4.1-mini",
    fetch: (async (_url, options) => {
      fetches++;
      providerSignal = options?.signal ?? undefined;
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'data: {"choices":[{"delta":{"content":"Partial"}}]}\n\n',
              ),
            );
          },
          cancel() {
            cancelledBody = true;
          },
        }),
      );
    }) as typeof fetch,
  };
  let complete!: () => void;
  const finished = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const response = streamResponse(async (emit, signal) => {
    try {
      await assert.rejects(
        requestModel(
          { ...input, signal, onText: (text) => emit({ type: "delta", text }) },
          dependencies,
        ),
        /Processing stopped/,
      );
    } finally {
      complete();
    }
  });
  const reader = response.body!.getReader();
  assert.match(
    new TextDecoder().decode((await reader.read()).value),
    /Partial/,
  );
  await reader.cancel();
  await finished;
  assert.equal(providerSignal?.aborted, true);
  assert.equal(cancelledBody, true);
  assert.equal(status, "pending");
  await assert.rejects(
    requestModel(input, dependencies),
    /pending reconciliation/,
  );
  assert.equal(fetches, 1);
  await assert.rejects(
    requestModel({ ...input, signal: AbortSignal.abort() }, dependencies),
    /abort/i,
  );
  assert.equal(fetches, 1);
});

test("incoming request cancellation reaches active non-streamed provider fetch", async () => {
  const request = new AbortController();
  let providerAborted = false;
  let complete!: () => void;
  const done = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const response = streamResponse(async (emit, signal) => {
    try {
      await assert.rejects(
        requestModel(
          {
            db: {
              rpc: async (name: string) => ({
                data: name === "reserve_model_cost" ? "reserved" : true,
              }),
            } as unknown as SupabaseClient,
            ownerId: "synthetic",
            requestKey: "cancel-fetch",
            role: "preparation",
            promptVersion: "test",
            system: "Fictional",
            input: "notes",
            schema: {},
            signal,
          },
          {
            mode: "live",
            key: "mock",
            model: "gpt-4.1-mini",
            fetch: async (_url, options) =>
              new Promise<Response>((_resolve, reject) => {
                options!.signal!.addEventListener(
                  "abort",
                  () => {
                    providerAborted = true;
                    reject(options!.signal!.reason);
                  },
                  { once: true },
                );
                emit({ type: "status", message: "Dispatched" });
              }),
          },
        ),
        /Processing stopped/,
      );
    } finally {
      complete();
    }
  }, request.signal);
  const reader = response.body!.getReader();
  await reader.read();
  request.abort();
  await done;
  assert.equal(providerAborted, true);
  await reader.cancel();
});
