import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Extraction } from "@/lib/ingestion/contracts";
import { clarify, extractText, IngestionError } from "@/lib/ingestion/server";
import type { PreparationActor } from "@/lib/preparations/service";
import { lessonSchema } from "@/lib/lessons/schema";
import { assertSessionAccess } from "@/lib/sessions/service";
import type {
  DocumentSummary,
  SavedDocument,
  SessionSource,
} from "./contracts";

const bucket = "source-documents";
const summary = "id,name,kind,bytes,created_at,state";
const unavailable = () =>
  new IngestionError(
    "document_unavailable",
    "This private document is unavailable. Check storage setup or try again.",
    503,
  );
const missing = () =>
  new IngestionError(
    "document_not_found",
    "This document is unavailable for your account.",
    404,
  );

export async function persistDocument(
  db: SupabaseClient,
  owner: string,
  file: File,
  bytes: Uint8Array,
  extraction: Extraction,
) {
  const id = randomUUID();
  const name =
    file.name.replace(/[\x00-\x1f\x7f/\\]/g, "_").slice(0, 160) ||
    `Document.${extraction.kind}`;
  const path = `${owner}/${id}.${extraction.kind}`;
  const reserved = await db.rpc("reserve_document", {
    p_owner: owner,
    p_id: id,
    p_name: name,
    p_kind: extraction.kind,
    p_bytes: bytes.byteLength,
    p_extraction: extraction,
  });
  if (reserved.error) {
    if (reserved.error.message.includes("document_limit"))
      throw new IngestionError(
        "document_limit",
        "You have 20 saved documents. Remove an original before adding another.",
        409,
      );
    throw unavailable();
  }
  let uploadAcknowledged = false;
  try {
    const uploaded = await db.storage.from(bucket).upload(path, bytes, {
      contentType:
        extraction.kind === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      cacheControl: "0",
      upsert: false,
    });
    if (uploaded.error) throw unavailable();
    uploadAcknowledged = true;
    const saved = await db
      .from("uploaded_documents")
      .update({ state: "ready" })
      .eq("owner_id", owner)
      .eq("id", id)
      .eq("state", "uploading")
      .select("id")
      .single();
    if (saved.error || !saved.data) throw unavailable();
    return id;
  } catch (error) {
    // A lost Storage response does not prove its remote writer stopped. Keep the
    // reserved path for operator reconciliation rather than risking a late orphan.
    if (!uploadAcknowledged) throw error;
    // Retain a durable cleanup record if Storage removal fails; never claim deletion.
    const cleanup = await db.storage.from(bucket).remove([path]);
    if (!cleanup.error)
      await db
        .from("uploaded_documents")
        .delete()
        .eq("owner_id", owner)
        .eq("id", id);
    else
      await db
        .from("uploaded_documents")
        .update({ state: "failed" })
        .eq("owner_id", owner)
        .eq("id", id)
        .eq("state", "uploading");
    throw error;
  }
}

export async function listDocuments(
  db: SupabaseClient,
  owner: string,
): Promise<DocumentSummary[]> {
  const result = await db
    .from("uploaded_documents")
    .select(summary)
    .eq("owner_id", owner)
    .order("created_at", { ascending: false })
    .limit(20);
  if (result.error) throw unavailable();
  return result.data ?? [];
}

export async function readDocument(
  db: SupabaseClient,
  owner: string,
  id: string,
): Promise<SavedDocument> {
  const result = await db
    .from("uploaded_documents")
    .select(`${summary},extraction`)
    .eq("id", id)
    .eq("owner_id", owner)
    .eq("state", "ready")
    .maybeSingle();
  if (result.error) throw unavailable();
  if (!result.data) throw missing();
  const { extraction, ...document } = result.data;
  return {
    document,
    extraction: { ...extraction, document_id: id, document_mode: "full" },
  };
}

export async function documentPreparation(
  db: SupabaseClient,
  actor: PreparationActor,
  id: string,
  mode: "full" | "excerpt",
  text: string,
  requestKey?: string,
) {
  let saved: SavedDocument;
  try {
    saved = await readDocument(db, actor.id, id);
  } catch (error) {
    if (
      !(error instanceof IngestionError) ||
      error.status !== 404 ||
      !requestKey
    )
      throw error;
    // Removing an original does not erase an already saved preparation. Only
    // the same owner/key/content may recover it; never create a new source here.
    const prior = await db
      .from("preparation_jobs")
      .select("partial_results")
      .eq("owner_id", actor.id)
      .eq("request_key", requestKey)
      .is("class_id", null)
      .maybeSingle();
    if (prior.error) throw unavailable();
    const result = prior.data?.partial_results;
    if (
      !result ||
      result.extraction?.document_id !== id ||
      result.extraction.document_mode !== mode ||
      (mode === "excerpt" && result.extraction.text !== text.trim())
    )
      throw error;
    return {
      status: result.status,
      extraction: result.extraction,
      context: result.context,
      questions: result.questions,
    };
  }
  const extraction: Extraction =
    mode === "full"
      ? saved.extraction
      : {
          ...extractText(text, "text"),
          document_id: id,
          document_mode: "excerpt",
        };
  return clarify(extraction, {
    subject: "The topic in these notes",
    grade: actor.grade || "Plain English; adapt to the student's explanations",
    scope:
      "Explain the main idea in these notes and apply it to one simple example.",
  });
}

export async function downloadDocument(
  db: SupabaseClient,
  owner: string,
  id: string,
) {
  const { document } = await readDocument(db, owner, id);
  const downloaded = await db.storage
    .from(bucket)
    .download(`${owner}/${id}.${document.kind}`);
  if (
    downloaded.error ||
    !downloaded.data ||
    downloaded.data.size !== document.bytes ||
    downloaded.data.size > 4194304
  )
    throw unavailable();
  return new Response(downloaded.data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="document.${document.kind}"; filename*=UTF-8''${encodeURIComponent(document.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function deleteDocument(
  db: SupabaseClient,
  owner: string,
  id: string,
) {
  const found = await db
    .from("uploaded_documents")
    .select("storage_path,state")
    .eq("owner_id", owner)
    .eq("id", id)
    .maybeSingle();
  if (found.error) throw unavailable();
  if (!found.data) throw missing();
  if (found.data.state === "uploading")
    throw new IngestionError(
      "document_busy",
      "An upload is still finishing. Retry shortly; contact support if it stays pending.",
      409,
    );
  const pending = await db
    .from("uploaded_documents")
    .update({ state: "deleting" })
    .eq("owner_id", owner)
    .eq("id", id);
  if (pending.error) throw unavailable();
  const removed = await db.storage
    .from(bucket)
    .remove([found.data.storage_path]);
  if (removed.error) throw unavailable();
  const deleted = await db
    .from("uploaded_documents")
    .delete()
    .eq("owner_id", owner)
    .eq("id", id);
  if (deleted.error) throw unavailable();
}

export async function deleteAccountDocuments(
  db: SupabaseClient,
  owner: string,
) {
  const found = await db
    .from("uploaded_documents")
    .select("id,state")
    .eq("owner_id", owner);
  if (found.error) throw unavailable();
  if (found.data?.some((row) => row.state === "uploading"))
    throw new IngestionError(
      "document_busy",
      "An upload is still finishing. Retry account deletion shortly; contact support if it stays pending.",
      409,
    );
  for (const document of found.data ?? [])
    await deleteDocument(db, owner, document.id);
}

export async function sessionSources(
  db: SupabaseClient,
  owner: string,
  id: string,
): Promise<SessionSource[]> {
  const actor = { id: owner, role: "learner" as const };
  await assertSessionAccess(db, actor, id);
  const session = await db
    .from("sessions")
    .select("lesson_version_id")
    .eq("id", id)
    .eq("learner_id", owner)
    .eq("visibility", "private")
    .maybeSingle();
  if (session.error) throw unavailable();
  if (!session.data) throw missing();
  const version = await db
    .from("lesson_versions")
    .select("lesson_json")
    .eq("id", session.data.lesson_version_id)
    .single();
  if (version.error) throw unavailable();
  const lesson = lessonSchema.parse(version.data.lesson_json);
  const sources = await Promise.all(
    lesson.sources.map(async (source): Promise<SessionSource> => {
      const stored = await db
        .from("source_documents")
        .select("kind,provenance")
        .eq("id", source.id)
        .eq("owner_id", owner)
        .maybeSingle();
      if (stored.error) throw unavailable();
      let document_id: string | null = null;
      if (stored.data?.provenance.document_id) {
        const available = await db
          .from("uploaded_documents")
          .select("id")
          .eq("id", stored.data.provenance.document_id)
          .eq("owner_id", owner)
          .eq("state", "ready")
          .maybeSingle();
        if (available.error) throw unavailable();
        document_id = available.data?.id ?? null;
      }
      return {
        title: source.title,
        document_id,
        mode:
          stored.data?.provenance.document_mode === "full" ? "full" : "excerpt",
        kind: stored.data?.kind ?? source.kind,
        references: lesson.references
          .filter((reference) => reference.source_id === source.id)
          .map((reference) => ({
            id: reference.id,
            text: reference.text,
            index:
              reference.location.kind === "page"
                ? reference.location.index
                : null,
            status: reference.status,
          })),
      };
    }),
  );
  await assertSessionAccess(db, actor, id);
  return sources;
}

export async function reconcileDocument(
  db: SupabaseClient,
  owner: string,
  id: string,
) {
  const found = await db
    .from("uploaded_documents")
    .select("created_at,state")
    .eq("owner_id", owner)
    .eq("id", id)
    .maybeSingle();
  if (found.error) throw unavailable();
  if (!found.data) throw missing();
  if (found.data.state === "uploading") {
    if (Date.now() - Date.parse(found.data.created_at) < 5 * 60_000)
      throw new IngestionError(
        "document_busy",
        "Wait at least five minutes and confirm the upload worker has ended before reconciliation.",
        409,
      );
    // Operator has confirmed no active writer. Fence any late finalization before removing bytes.
    const fenced = await db
      .from("uploaded_documents")
      .update({ state: "failed" })
      .eq("owner_id", owner)
      .eq("id", id)
      .eq("state", "uploading");
    if (fenced.error) throw unavailable();
  }
  await deleteDocument(db, owner, id);
}
