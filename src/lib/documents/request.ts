import "server-only";
import { z } from "zod";
import { IngestionError } from "@/lib/ingestion/server";
import { isSameOrigin } from "@/lib/http/origin";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteDocument,
  downloadDocument,
  listDocuments,
  readDocument,
  sessionSources,
} from "./service";

export async function handleDocumentRequest(
  request: Request,
  access: () => Promise<{ db: SupabaseClient; owner: string }>,
  id?: string,
  action?: "file" | "sources",
) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (request.method !== "GET" && !isSameOrigin(request))
      throw new IngestionError(
        "forbidden_origin",
        "Submit this request from Errby.",
        403,
      );
    const { db, owner } = await access();
    if (id !== undefined && !z.uuid().safeParse(id).success)
      throw new IngestionError(
        "invalid_document",
        "Use a valid document link.",
        400,
      );
    if (action === "sources" && id)
      return Response.json(
        { sources: await sessionSources(db, owner, id) },
        { headers },
      );
    if (request.method === "DELETE" && id) {
      await deleteDocument(db, owner, id);
      return Response.json({ status: "deleted" }, { headers });
    }
    if (request.method !== "GET")
      throw new IngestionError(
        "invalid_request",
        "Unsupported document request.",
        405,
      );
    if (id && action === "file") return await downloadDocument(db, owner, id);
    return Response.json(
      id
        ? await readDocument(db, owner, id)
        : { documents: await listDocuments(db, owner) },
      { headers },
    );
  } catch (error) {
    const failure =
      error instanceof IngestionError
        ? error
        : new IngestionError(
            "document_unavailable",
            "Documents are temporarily unavailable. Try again.",
            503,
          );
    return Response.json(
      { error_code: failure.code, user_message: failure.message },
      { status: failure.status, headers },
    );
  }
}
