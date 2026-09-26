import "server-only";
import { INGESTION_LIMITS } from "./contracts";
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
  identity: () => Promise<{ grade: string } | null>,
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
    const account = mode === "live" ? await identity() : null;
    if (mode === "live" && !account)
      throw new IngestionError(
        "unauthenticated",
        "Sign in to prepare your own material. Your input is unchanged.",
        401,
      );
    const form = await boundedFormData(
      request,
      mode === "live" ? INGESTION_LIMITS.bytes + 150_000 : 150_000,
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
        "Choose a topic, pasted text or text PDF.",
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
        throw new IngestionError("missing_file", "Choose one text PDF.", 400);
      if (file.size > INGESTION_LIMITS.bytes)
        throw new IngestionError(
          "too_large",
          "Use one PDF no larger than 10 MiB.",
          413,
        );
      source = await (kind === "pdf" ? extractPdf : extractDocx)(
        new Uint8Array(await file.arrayBuffer()),
        file.type,
      );
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
