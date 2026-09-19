import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IngestionError } from "@/lib/ingestion/server";
import { handlePreparation } from "@/lib/ingestion/request";
import {
  advancePreparation,
  createPreparation,
  databaseFailure,
  listPreparations,
  readPreparation,
  uuid,
  type PreparationActor,
} from "./service";

export type PreparationAccess = { db: SupabaseClient; actor: PreparationActor };
export async function handleDurablePreparation(
  request: Request,
  access: () => Promise<PreparationAccess>,
  id?: string,
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
        "Use a valid saved preparation link.",
        400,
      );
    if (request.method === "GET")
      return Response.json(
        id
          ? await readPreparation(db, actor, id)
          : { jobs: await listPreparations(db, actor) },
        { headers },
      );
    if (!id) {
      const key = request.headers.get("idempotency-key");
      const classId = request.headers.get("x-errby-class-id");
      if (
        !uuid.safeParse(key).success ||
        (classId !== null && !uuid.safeParse(classId).success)
      )
        throw new IngestionError(
          "invalid_request",
          "Use a UUID retry key and a valid optional class ID.",
          400,
        );
      // Scope is checked before reading or parsing a potentially expensive PDF.
      const scoped = await db.rpc("check_preparation_owner", {
        p_owner: actor.id,
        p_class: classId,
      });
      if (scoped.error) databaseFailure(scoped.error);
      const extraction = await handlePreparation(request, "live", async () => ({
        grade: actor.grade,
      }));
      if (!extraction.ok) return extraction;
      const job = await createPreparation(
        db,
        actor,
        key!,
        classId,
        await extraction.json(),
      );
      return Response.json({ job }, { status: 201, headers });
    }
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new IngestionError(
        "invalid_request",
        "Submit a JSON step request.",
        400,
      );
    const body = await boundedJson(request);
    return Response.json(await advancePreparation(db, actor, id, body), {
      headers,
    });
  } catch (error) {
    const failure =
      error instanceof IngestionError
        ? error
        : new IngestionError(
            "preparation_unavailable",
            "Preparation is unavailable. Check hosted Supabase configuration and migrations, then retry your saved preparation.",
            503,
          );
    return Response.json(
      { error_code: failure.code, user_message: failure.message },
      { status: failure.status, headers },
    );
  }
}
async function boundedJson(request: Request) {
  const maximum = 500_000;
  if (Number(request.headers.get("content-length")) > maximum)
    throw new IngestionError("too_large", "Use a draft below 500 kB.", 413);
  if (!request.body)
    throw new IngestionError(
      "invalid_request",
      "The step request is empty.",
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
        throw new IngestionError("too_large", "Use a draft below 500 kB.", 413);
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof IngestionError) throw error;
    throw new IngestionError(
      "invalid_request",
      "The JSON request is incomplete or invalid. Your saved source is unchanged.",
      400,
    );
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
