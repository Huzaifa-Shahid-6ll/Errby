import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env/server";
import { IngestionError } from "@/lib/ingestion/server";
import { readEvents } from "@/lib/http/event-stream";

export type AiRole = "preparation" | "evaluation" | "errby";
type ModelInput = {
  db: SupabaseClient;
  ownerId: string;
  requestKey: string;
  role: AiRole;
  promptVersion: string;
  system: string;
  input: unknown;
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
  onText?: (text: string) => void;
  signal?: AbortSignal;
};

export function modelRequestKey(value: string) {
  const hex = createHash("sha256").update(value).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const unavailable = (code: string, message: string) =>
  new IngestionError(code, message, 503);

export async function requestModel(
  input: ModelInput,
  dependencies: {
    fetch?: typeof fetch;
    key?: string;
    model?: string;
    mode?: string;
  } = {},
): Promise<{ output: unknown; model: string; tokens: number }> {
  input.signal?.throwIfAborted();
  const key = dependencies.key ?? env.OPENROUTER_API_KEY;
  const configuredModel = dependencies.model ?? env.OPENROUTER_MODEL;
  const model = configuredModel.includes("/")
    ? configuredModel
    : `openai/${configuredModel}`;
  if (
    (dependencies.mode ?? env.ERRBY_MODE) !== "live" ||
    !key?.trim() ||
    model !== "openai/gpt-4.1-mini"
  )
    throw unavailable(
      "model_unavailable",
      "AI generation is not configured. Your saved work is unchanged.",
    );
  const maxTokens =
    input.maxOutputTokens ?? (input.role === "preparation" ? 6000 : 1500);
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 6000)
    throw unavailable(
      "model_limit",
      "This AI request exceeds the configured limit.",
    );
  if (input.onText && input.role !== "errby")
    throw unavailable(
      "model_limit",
      "Structured assessments cannot stream as text.",
    );
  const payload = {
    model,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: JSON.stringify(input.input) },
    ],
    response_format: input.onText
      ? undefined
      : {
          type: "json_schema",
          json_schema: {
            name: "errby_response",
            strict: true,
            // Zod emits oneOf for disjoint discriminators and URI formats. The
            // provider accepts anyOf; callers still validate the original Zod schema.
            schema: JSON.parse(
              JSON.stringify(input.schema, (key, value) => {
                if (key === "format" && value === "uri") return undefined;
                if (value && typeof value === "object" && "oneOf" in value) {
                  const { oneOf, ...rest } = value;
                  return { ...rest, anyOf: oneOf };
                }
                return value;
              }),
            ),
          },
        },
    provider: {
      require_parameters: true,
      data_collection: "deny",
      zdr: true,
      max_price: { prompt: "0.4", completion: "1.6", request: "0" },
    },
    stream: Boolean(input.onText),
    temperature: 0,
    max_tokens: maxTokens,
  };
  const body = JSON.stringify(payload);
  // UTF-8 bytes upper-bound text tokens; reserve schema and framing overhead too.
  const maximum =
    Math.ceil(
      ((Buffer.byteLength(body, "utf8") + 1024) * 0.0000004 +
        maxTokens * 0.0000016) *
        1e6,
    ) / 1e6;
  if (maximum > 0.03)
    throw unavailable(
      "model_limit",
      "This material is too large for the AI budget. Use a shorter source.",
    );
  const requestKey = modelRequestKey(
    JSON.stringify([
      input.ownerId,
      input.requestKey,
      input.role,
      input.promptVersion,
      model,
      body,
    ]),
  );
  const { data: status, error: reservationError } = await input.db.rpc(
    "reserve_model_cost",
    {
      p_request_key: requestKey,
      p_owner: input.ownerId,
      p_role: input.role,
      p_max_cost: maximum,
    },
  );
  if (reservationError)
    throw unavailable(
      "model_budget_unavailable",
      "AI capacity or budget is unavailable. Your work is saved; try again later.",
    );
  if (status === "succeeded") {
    const { data, error } = await input.db
      .from("usage_ledger")
      .select("response_json,model_id,actual_tokens")
      .eq("request_key", requestKey)
      .single();
    if (
      error ||
      !data ||
      data.response_json === null ||
      typeof data.model_id !== "string" ||
      !Number.isInteger(data.actual_tokens)
    )
      throw unavailable(
        "model_replay_unavailable",
        "The saved AI response is unavailable. Your work remains saved.",
      );
    return {
      output: data.response_json,
      model: data.model_id,
      tokens: data.actual_tokens,
    };
  }
  if (status !== "reserved")
    throw unavailable(
      "model_pending",
      "This AI request is pending reconciliation or has failed. Your work remains saved.",
    );
  input.signal?.throwIfAborted();
  const { data: claimed, error: claimError } = await input.db.rpc(
    "claim_model_request",
    { p_request_key: requestKey },
  );
  if (claimError || claimed !== true)
    throw unavailable(
      "model_pending",
      "This AI request is already processing or unavailable. Your work remains saved.",
    );

  let response: Response;
  let raw: unknown;
  const signal = AbortSignal.any([
    AbortSignal.timeout(45_000),
    ...(input.signal ? [input.signal] : []),
  ]);
  try {
    response = await (dependencies.fetch ?? fetch)(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body,
        signal,
      },
    );
    if (input.onText && response.ok && response.body) {
      let content = "";
      let id: unknown;
      let usage: unknown;
      let finish: unknown;
      let refused = false;
      for await (const chunk of readEvents(
        response.body,
        true,
        250_000,
        signal,
      )) {
        if (chunk.error) throw new Error("Provider stream failed");
        id = chunk.id ?? id;
        usage = chunk.usage ?? usage;
        const choice = chunk.choices?.[0];
        finish = choice?.finish_reason ?? finish;
        refused ||= Boolean(choice?.delta?.refusal);
        const text = choice?.delta?.content;
        if (typeof text === "string") {
          content += text;
          if (content.length > 8000)
            throw new Error("Provider output too large");
          input.onText(text);
        }
      }
      raw = {
        id,
        usage,
        choices: [
          {
            finish_reason: finish,
            message: {
              content: JSON.stringify({ text: content }),
              refusal: refused,
            },
          },
        ],
      };
    } else {
      raw = await response.json();
    }
  } catch {
    // Ambiguous dispatch remains fully reserved; never retry or release automatically.
    if (input.signal?.aborted)
      throw new IngestionError(
        "generation_stopped",
        "Processing stopped. Saved work is retained. Provider charges may still apply; this request needs reconciliation before retrying.",
        409,
      );
    throw unavailable(
      "model_outcome_unknown",
      "AI did not return a confirmed response. Your work is saved; this request needs reconciliation.",
    );
  }
  const result = raw as {
    id?: unknown;
    model?: unknown;
    usage?: { cost?: unknown; total_tokens?: unknown };
    choices?: {
      finish_reason?: unknown;
      message?: { content?: unknown; refusal?: unknown };
    }[];
  } | null;
  const cost = result?.usage?.cost;
  const tokens = result?.usage?.total_tokens;
  if (
    [400, 401, 402, 403, 404, 422].includes(response.status) &&
    cost == null &&
    tokens == null
  ) {
    const { error } = await input.db.rpc("settle_model_cost", {
      p_request_key: requestKey,
      p_status: "failed",
      p_tokens: 0,
      p_actual_cost: 0,
      p_model_id: model,
    });
    if (error)
      throw unavailable(
        "model_settlement_unconfirmed",
        "AI rejection could not be recorded. Your work remains saved.",
      );
    throw unavailable(
      "model_request_rejected",
      "AI could not accept this request. Your work is saved; check configuration or try a revised request.",
    );
  }
  if (
    typeof cost !== "number" ||
    !Number.isFinite(cost) ||
    cost < 0 ||
    cost > maximum ||
    typeof tokens !== "number" ||
    !Number.isSafeInteger(tokens) ||
    tokens < 0 ||
    typeof result?.id !== "string"
  )
    throw unavailable(
      "model_usage_unknown",
      "AI billing could not be confirmed. Your work is saved; this request needs reconciliation.",
    );
  let output: unknown = null;
  const choice = result?.choices?.[0];
  let valid =
    response.ok &&
    choice?.finish_reason === "stop" &&
    !choice.message?.refusal &&
    typeof choice.message?.content === "string";
  if (valid) {
    try {
      output = JSON.parse(choice!.message!.content as string);
      valid = output !== null && typeof output === "object";
    } catch {
      valid = false;
    }
  }
  const { error: settlementError } = await input.db.rpc("settle_model_cost", {
    p_request_key: requestKey,
    p_status: valid ? "succeeded" : "failed",
    p_tokens: tokens,
    p_actual_cost: Math.ceil(cost * 1e6) / 1e6,
    p_model_id: model,
    p_provider_id: result.id,
    p_response_json: valid ? output : null,
  });
  if (settlementError)
    throw unavailable(
      "model_settlement_unconfirmed",
      "AI usage could not be saved. Your work remains saved; this request needs reconciliation.",
    );
  if (!valid)
    throw unavailable(
      "model_invalid_response",
      "AI could not produce a usable response. Your work is saved; try again later.",
    );
  return { output, model, tokens };
}
