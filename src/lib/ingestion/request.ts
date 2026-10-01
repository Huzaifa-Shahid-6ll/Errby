import "server-only";
import { createHash } from "node:crypto";
import { INGESTION_LIMITS, type Extraction } from "./contracts";
import { cachedExtraction } from "./cache";
import {
  boundedFormData,
  clarify,
  extractDocx,
  extractPdf,
  extractResource,
  extractText,
  IngestionError,
} from "./server";
import { demoPdfPages, syntheticPdf } from "./synthetic-pdf";

let demoExtraction: ReturnType<typeof extractPdf> | undefined;

export async function handlePreparation(
  request: Request,
  mode: "demo" | "live",
  identity: () => Promise<{ id?: string; grade: string } | null>,
  maxFileBytes: number = INGESTION_LIMITS.bytes,
  persist?: (
    owner: string,
    file: File,
    bytes: Uint8Array,
    extraction: Extraction,
  ) => Promise<string>,
) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const originHeader = request.headers.get("origin") ?? "";
    const origin = URL.canParse(originHeader) ? new URL(originHeader) : null;
    const requestUrl = new URL(request.url);
    // Next may construct Request.url with its internal hostname; browsers send
    // their actual destination in Host. Never use untrusted forwarded-host here.
    const host = request.headers.get("host") ?? requestUrl.host;
    if (
      !origin ||
      !["http:", "https:"].includes(origin.protocol) ||
      origin.origin !== originHeader ||
      origin.host !== host ||
      origin.protocol !== requestUrl.protocol
    )
      throw new IngestionError(
        "forbidden_origin",
        "Submit this form from Errby.",
        403,
      );
    let account = mode === "live" ? await identity() : null;
    if (mode === "live" && !account)
      throw new IngestionError(
        "unauthenticated",
        "Sign in to prepare your own material. Your input is unchanged.",
        401,
      );
    const form = await boundedFormData(
      request,
      mode === "live" ? maxFileBytes + 150_000 : 150_000,
    );
    const allowed = [
      "kind",
      "text",
      "url",
      "subject",
      "grade",
      "scope",
      "file",
    ];
    for (const key of form.keys()) {
      if (!allowed.includes(key) || form.getAll(key).length !== 1)
        throw new IngestionError(
          "invalid_request",
          "Use one source and one value per field.",
          400,
        );
    }
    const kind = form.get("kind");
    if (
      !["topic", "text", "resource", "pdf", "docx", "sample"].includes(
        String(kind),
      )
    )
      throw new IngestionError(
        "invalid_kind",
        "Choose a topic, pasted text, resource link, PDF or DOCX.",
        400,
      );
    if (
      mode === "demo" &&
      (["pdf", "docx"].includes(String(kind)) || form.has("file"))
    )
      throw new IngestionError(
        "demo_upload_disabled",
        "Personal uploads require a signed-in account. Use the fictional PDF sample in this demo.",
        403,
      );
    const context = Object.fromEntries(
      ["subject", "grade", "scope"].map((key) => [key, form.get(key) ?? ""]),
    );
    // Validate all context before spending parser resources.
    clarify(extractText("validation", "topic"), context, account?.grade);
    const file = form.get("file");
    if (kind !== "pdf" && kind !== "docx" && file)
      throw new IngestionError(
        "unexpected_file",
        "Choose PDF or DOCX input to extract an attached file.",
        400,
      );
    let source;
    if (kind === "pdf" || kind === "docx") {
      if (!(file instanceof File))
        throw new IngestionError(
          "missing_file",
          "Choose one PDF or DOCX.",
          400,
        );
      if (file.size > maxFileBytes)
        throw new IngestionError(
          "too_large",
          `Use one PDF or DOCX no larger than ${maxFileBytes / 1024 / 1024} MiB.`,
          413,
        );
      const bytes = new Uint8Array(await file.arrayBuffer());
      // Body acquisition can outlive sign-out/deletion. Recheck before admitting
      // reusable private results, not just before accepting a potentially slow body.
      if (account?.id) {
        const current = await identity();
        if (!current || current.id !== account.id)
          throw new IngestionError(
            "unauthenticated",
            "Sign in again to import this file. Your draft is unchanged.",
            401,
          );
        account = current;
      }
      const extract = () =>
        (kind === "pdf" ? extractPdf : extractDocx)(bytes, file.type);
      source = account?.id
        ? await cachedExtraction(
            account.id,
            JSON.stringify([
              kind,
              file.type,
              createHash("sha256").update(bytes).digest("hex"),
            ]),
            extract,
          )
        : await extract();
      if (persist && account?.id) {
        const document_id = await persist(account.id, file, bytes, source);
        source = { ...source, document_id, document_mode: "full" as const };
      }
    } else if (kind === "sample") {
      // The anonymous demo can only parse these fixed fictional bytes, once per process.
      demoExtraction ??= extractPdf(
        syntheticPdf(demoPdfPages),
        "application/pdf",
      ).catch((error) => {
        demoExtraction = undefined;
        throw error;
      });
      source = {
        ...(await demoExtraction),
        provenance: "fictional_unreviewed" as const,
      };
    } else if (kind === "resource") {
      source = extractResource(form.get("url"), form.get("text"));
    } else {
      source = extractText(form.get("text"), kind as "topic" | "text");
    }
    return Response.json(clarify(source, context, account?.grade), { headers });
  } catch (error) {
    const failure =
      error instanceof IngestionError
        ? error
        : new IngestionError(
            "preparation_unavailable",
            "Preparation is temporarily unavailable. Your input is unchanged; try again.",
            503,
          );
    return Response.json(
      { error_code: failure.code, user_message: failure.message },
      { status: failure.status, headers },
    );
  }
}
