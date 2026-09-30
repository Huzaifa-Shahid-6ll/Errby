import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IngestionError } from "@/lib/ingestion/server";
import { processSession } from "./process";
import { streamResponse } from "@/lib/http/stream-response";
import {
  getSession,
  openSession,
  submitTurn,
  setSessionPaused,
  uuid,
  type SessionActor,
} from "./service";

export type SessionAccess = { db: SupabaseClient; actor: SessionActor };

export async function handleSessionApi(
  request: Request,
  access: () => Promise<SessionAccess>,
  id?: string,
  turns = false,
  action = false,
  process = false,
) {
  const headers = { "Cache-Control": "no-store" };
  try {
    if (request.method !== "GET") {
      const value = request.headers.get("origin") ?? "";
      const origin = URL.canParse(value) ? new URL(value) : null;
      const target = new URL(request.url);
      if (
        !origin ||
        origin.origin !== value ||
        origin.host !== (request.headers.get("host") ?? target.host) ||
        origin.protocol !== target.protocol
      )
        throw new IngestionError(
          "forbidden_origin",
          "Submit this request from Errby.",
          403,
        );
    }
    const { db, actor } = await access();
    if (id && !uuid.safeParse(id).success)
      throw new IngestionError(
        "invalid_id",
        "Use a valid saved session link.",
        400,
      );
    if (request.method === "GET" && id)
      return Response.json(await getSession(db, actor, id), { headers });
    if (request.method === "GET")
      throw new IngestionError(
        "invalid_request",
        "Open a specific saved session link.",
        405,
      );
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new IngestionError(
        "invalid_request",
        "Submit a JSON session request.",
        400,
      );
    const body = await boundedJson(request);
    if (process) {
      if (
        !id ||
        request.method !== "POST" ||
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).length
      )
        throw new IngestionError(
          "invalid_request",
          "Retry the saved turn with an empty JSON object.",
          400,
        );
      if (request.headers.get("accept")?.includes("text/event-stream")) {
        const sessionId = id;
        return streamResponse(async (emit) => {
          emit({ type: "status", message: "Checking your saved explanation…" });
          return processSession(db, actor, sessionId);
        });
      }
      return Response.json(await processSession(db, actor, id), { headers });
    }
    if (action) {
      if (
        request.method !== "POST" ||
        !id ||
        typeof body?.pause !== "boolean" ||
        Object.keys(body).length !== 1
      )
        throw new IngestionError(
          "invalid_request",
          "Choose pause or resume for this session.",
          400,
        );
      return Response.json(await setSessionPaused(db, actor, id, body.pause), {
        headers,
      });
    }
    if (!id) {
      const state = await openSession(db, actor, body);
      return Response.json(state, { status: 201, headers });
    }
    if (!turns)
      throw new IngestionError(
        "invalid_request",
        "This session route only accepts turn submissions.",
        405,
      );
    if (request.headers.get("accept")?.includes("text/event-stream")) {
      const sessionId = id;
      return streamResponse(async (emit) => {
        emit({ type: "status", message: "Saving your explanation…" });
        const saved = await submitTurn(db, actor, sessionId, body);
        emit({
          type: "status",
          message:
            "Answer saved. Checking the evidence and preparing Errby’s reply…",
        });
        const state = await processSession(db, actor, sessionId);
        return { ...state, message: saved.message };
      });
    }
    const saved = await submitTurn(db, actor, id, body);
    const state = await processSession(db, actor, id);
    return Response.json({ ...state, message: saved.message }, { headers });
  } catch (error) {
    const failure =
      error instanceof IngestionError
        ? error
        : new IngestionError(
            "session_unavailable",
            "Sessions are unavailable. Check hosted Supabase configuration and migrations, then retry.",
            503,
          );
    return Response.json(
      { error_code: failure.code, user_message: failure.message },
      { status: failure.status, headers },
    );
  }
}

export async function boundedJson(request: Request) {
  const maximum = 500_000;
  if (Number(request.headers.get("content-length")) > maximum)
    throw new IngestionError("too_large", "Use an answer below 500 kB.", 413);
  if (!request.body)
    throw new IngestionError(
      "invalid_request",
      "The session request is empty.",
      400,
    );
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  let expired = false;
  const timer = setTimeout(() => {
    expired = true;
    void reader.cancel().catch(() => {});
  }, 15000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (expired) throw new Error("expired");
      if (done) break;
      length += value.length;
      if (length > maximum) {
        void reader.cancel().catch(() => {});
        throw new IngestionError(
          "too_large",
          "Use an answer below 500 kB.",
          413,
        );
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof IngestionError) throw error;
    throw new IngestionError(
      "invalid_request",
      "The JSON request is incomplete or invalid. Your saved session is unchanged.",
      400,
    );
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
