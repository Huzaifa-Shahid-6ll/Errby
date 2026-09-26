import "server-only";
import { createHash } from "node:crypto";
import { Worker } from "node:worker_threads";
import { z } from "zod";
import {
  INGESTION_LIMITS,
  type Extraction,
  type PreparationResult,
} from "./contracts";
import { pdfWorkerCode } from "./pdf-worker";
import { docxWorkerCode } from "./docx-worker";

export class IngestionError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 422,
  ) {
    super(message);
  }
}
const messages: Record<string, string> = {
  encrypted_pdf:
    "This PDF is encrypted. Upload an unlocked readable PDF or paste permitted text.",
  too_many_pages: "This PDF exceeds 50 pages. Split it into smaller units.",
  too_many_characters:
    "The source exceeds 30,000 characters. Split it into smaller units; nothing was truncated.",
  unreadable_pdf:
    "This PDF could not be read. Upload a readable text PDF or paste its text.",
  unreadable_docx:
    "This DOCX could not be read. Upload a readable DOCX or paste its text.",
  parser_timeout:
    "PDF extraction took too long. Try a smaller PDF or paste its text.",
};
export const pastedTextSchema = z
  .string()
  .min(1)
  .max(INGESTION_LIMITS.characters)
  .transform((text) => text.trim())
  .pipe(z.string().min(1));
export function acceptPastedText(text: unknown) {
  const result = pastedTextSchema.safeParse(text);
  if (!result.success)
    throw new IngestionError(
      "invalid_text",
      "Enter 1–30,000 characters of topic or source text.",
      400,
    );
  return { text: result.data, provenance: "user_supplied_unreviewed" as const };
}
function extraction(
  kind: Extraction["kind"],
  pages: Extraction["pages"],
  bytes: Uint8Array | string,
  parser: string,
  warnings: string[] = [],
): Extraction {
  const missing_pages = pages
    .filter((page) => !page.text.trim())
    .map((page) => page.page);
  const text =
    kind === "pdf" || kind === "docx"
      ? pages
          .map(
            (page) =>
              `[${kind === "docx" ? "Section" : "Page"} ${page.page}]\n${page.text || "[No extractable text]"}`,
          )
          .join("\n\n")
      : pages[0].text;
  return {
    kind,
    source_role: kind === "topic" ? "scope" : "evidence",
    provenance: "user_supplied_unreviewed",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    parser,
    pages,
    text,
    sample: text.slice(0, 1_000),
    coverage: {
      total_pages: pages.length,
      text_pages: pages.length - missing_pages.length,
      missing_pages,
    },
    warnings,
  };
}
export function extractText(text: unknown, kind: "topic" | "text") {
  const accepted = acceptPastedText(text);
  if (/^https?:\/\/\S+$/i.test(accepted.text))
    throw new IngestionError(
      "link_needs_text",
      "Links are not imported here. Paste the permitted webpage text or video transcript; no video has been watched.",
    );
  return extraction(
    kind,
    [{ page: 1, text: accepted.text }],
    accepted.text,
    "errby-text/1",
  );
}
export function extractResource(url: unknown, text: unknown): Extraction {
  if (typeof url !== "string" || url.length > 2_048 || !URL.canParse(url))
    throw new IngestionError(
      "invalid_link",
      "Enter one HTTPS resource link.",
      400,
    );
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password
  )
    throw new IngestionError(
      "invalid_link",
      "Enter one public HTTPS resource link without credentials.",
      400,
    );
  if (typeof text !== "string" || !text.trim())
    throw new IngestionError(
      "link_needs_text",
      "The link was not imported. Paste permitted webpage text or a video transcript; no video has been watched.",
      422,
    );
  const source = extractText(text, "text");
  return {
    ...source,
    source_url: parsed.href,
    warnings: [
      "Only your pasted text was extracted. The link was recorded as context, not fetched or watched; review the text against the resource.",
    ],
  };
}
// ponytail: one parser per Node process; use a shared admission limit before scaling across instances.
let parsing = false;
export async function extractPdf(
  bytes: Uint8Array,
  mime: string,
): Promise<Extraction> {
  if (!bytes.length)
    throw new IngestionError(
      "empty_file",
      "The PDF is empty. Choose a readable PDF or paste text.",
    );
  if (bytes.length > INGESTION_LIMITS.bytes)
    throw new IngestionError(
      "too_large",
      "Use one PDF no larger than 10 MiB.",
      413,
    );
  if (
    mime !== "application/pdf" ||
    !Buffer.from(bytes.subarray(0, 8))
      .toString("ascii")
      .match(/^%PDF-\d\.\d/)
  )
    throw new IngestionError(
      "unsupported_file",
      "Use a text PDF with PDF content and application/pdf type, or paste text.",
    );
  if (parsing)
    throw new IngestionError(
      "parser_busy",
      "Another PDF is being extracted. Try again shortly; your input is unchanged.",
      429,
    );
  parsing = true;
  try {
    type PdfResult = {
      pages: Extraction["pages"];
      parser: string;
      metadataWarning: boolean;
    };
    const result = await new Promise<PdfResult>((resolve, reject) => {
      const worker = new Worker(pdfWorkerCode, {
        eval: true,
        execArgv: [],
        workerData: {
          bytes,
          pages: INGESTION_LIMITS.pages,
          characters: INGESTION_LIMITS.characters,
        },
        resourceLimits: { maxOldGenerationSizeMb: 128, stackSizeMb: 4 },
      });
      const timer = setTimeout(
        () =>
          finish(new IngestionError("parser_timeout", messages.parser_timeout)),
        INGESTION_LIMITS.milliseconds,
      );
      let done = false;
      function finish(error?: Error, data?: PdfResult) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        void worker.terminate().then(
          () => {
            if (error) reject(error);
            else resolve(data!);
          },
          () =>
            reject(
              error ??
                new IngestionError("unreadable_pdf", messages.unreadable_pdf),
            ),
        );
      }
      worker.once("message", (data) =>
        data.error
          ? finish(
              new IngestionError(
                data.error,
                messages[data.error] || messages.unreadable_pdf,
              ),
            )
          : finish(undefined, data),
      );
      worker.once("error", () =>
        finish(new IngestionError("unreadable_pdf", messages.unreadable_pdf)),
      );
      worker.once("exit", () =>
        finish(new IngestionError("unreadable_pdf", messages.unreadable_pdf)),
      );
    });
    if (!result.pages.some((page) => page.text.trim()))
      throw new IngestionError(
        "no_text",
        "No readable text was found. This PDF may be scanned or blank. OCR is unavailable; paste text or use a text PDF.",
      );
    const warnings = [
      "Extracted text is unreviewed. Check reading order, symbols and any images or tables against the original; text presence does not prove full page coverage.",
    ];
    if (result.pages.some((page) => !page.text.trim()))
      warnings.push(
        "Some pages have no extractable text. Extraction is partial; add readable text for the missing pages.",
      );
    if (result.metadataWarning)
      warnings.push(
        "PDF metadata may contain an author or contact details. Check and remove personal information before sharing the source.",
      );
    return extraction("pdf", result.pages, bytes, result.parser, warnings);
  } finally {
    parsing = false;
  }
}
export async function extractDocx(
  bytes: Uint8Array,
  mime: string,
): Promise<Extraction> {
  if (!bytes.length)
    throw new IngestionError(
      "empty_file",
      "The DOCX is empty. Choose a readable DOCX or paste text.",
    );
  if (bytes.length > INGESTION_LIMITS.bytes)
    throw new IngestionError(
      "too_large",
      "Use one DOCX no larger than 10 MiB.",
      413,
    );
  if (
    mime !==
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    !Buffer.from(bytes.subarray(0, 4)).equals(
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    )
  )
    throw new IngestionError(
      "unsupported_file",
      "Use a DOCX file, or paste text.",
    );
  if (parsing)
    throw new IngestionError(
      "parser_busy",
      "Another file is being extracted. Try again shortly; your input is unchanged.",
      429,
    );
  parsing = true;
  try {
    const result = await new Promise<{
      pages: Extraction["pages"];
      parser: string;
    }>((resolve, reject) => {
      const worker = new Worker(docxWorkerCode, {
        eval: true,
        execArgv: [],
        workerData: {
          bytes,
          pages: INGESTION_LIMITS.pages,
          characters: INGESTION_LIMITS.characters,
        },
        resourceLimits: { maxOldGenerationSizeMb: 128, stackSizeMb: 4 },
      });
      let done = false;
      const timer = setTimeout(
        () =>
          finish(
            new IngestionError(
              "parser_timeout",
              "DOCX extraction took too long. Try a smaller file or paste text.",
            ),
          ),
        INGESTION_LIMITS.milliseconds,
      );
      function finish(
        error?: Error,
        data?: { pages: Extraction["pages"]; parser: string },
      ) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        void worker.terminate().then(
          () => (error ? reject(error) : resolve(data!)),
          () =>
            reject(
              error ??
                new IngestionError("unreadable_docx", messages.unreadable_docx),
            ),
        );
      }
      worker.once("message", (data) =>
        data.error
          ? finish(
              new IngestionError(
                data.error,
                messages[data.error] || messages.unreadable_docx,
              ),
            )
          : finish(undefined, data),
      );
      worker.once("error", () =>
        finish(new IngestionError("unreadable_docx", messages.unreadable_docx)),
      );
      worker.once("exit", () =>
        finish(new IngestionError("unreadable_docx", messages.unreadable_docx)),
      );
    });
    if (!result.pages.length)
      throw new IngestionError(
        "no_text",
        "No readable DOCX text was found. Paste its text instead.",
      );
    return extraction("docx", result.pages, bytes, result.parser, [
      "DOCX paragraphs are numbered as sections. Formatting, images and tables may be incomplete; review against the original before using as evidence.",
    ]);
  } finally {
    parsing = false;
  }
}
const contextSchema = z
  .object({
    subject: z.string().trim().max(100).default(""),
    grade: z.string().trim().max(100).default(""),
    scope: z.string().trim().max(1_000).default(""),
  })
  .strict();
export function clarify(
  source: Extraction,
  input: unknown,
  existingGrade = "",
): PreparationResult {
  const result = contextSchema.safeParse(input);
  if (!result.success)
    throw new IngestionError(
      "invalid_context",
      "Use a subject and level up to 100 characters, and a scope up to 1,000 characters.",
      400,
    );
  const context = result.data;
  context.grade ||=
    existingGrade ||
    source.text.match(/\b(?:grade|year)\s+\d{1,2}\b/i)?.[0] ||
    "";
  const questions: PreparationResult["questions"] = [];
  if (!context.subject)
    questions.push({
      field: "subject",
      question: "Which subject is this for?",
    });
  if (!context.grade)
    questions.push({
      field: "grade",
      question: "What grade or learning level should we use?",
    });
  if (!context.scope)
    questions.push({
      field: "scope",
      question: "What should the learner be able to explain, and how deeply?",
    });
  return {
    status: source.coverage.missing_pages.length
      ? "partial"
      : questions.length
        ? "needs_clarification"
        : "extracted_needs_review",
    extraction: source,
    context,
    questions,
  };
}
export async function boundedFormData(request: Request, maximum: number) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    throw new IngestionError(
      "invalid_request",
      "Submit the preparation form as multipart data.",
      400,
    );
  if (Number(request.headers.get("content-length")) > maximum)
    throw new IngestionError(
      "too_large",
      "The request exceeds the accepted upload limit.",
      413,
    );
  if (!request.body)
    throw new IngestionError(
      "empty_request",
      "Enter a topic, text or PDF.",
      400,
    );
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void reader.cancel().catch(() => {});
  }, INGESTION_LIMITS.milliseconds);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (timedOut) throw new Error("timeout");
      if (done) break;
      length += value.length;
      if (length > maximum) {
        void reader.cancel().catch(() => {});
        throw new IngestionError(
          "too_large",
          "The request exceeds the accepted upload limit.",
          413,
        );
      }
      chunks.push(value);
    }
    return await new Response(Buffer.concat(chunks), {
      headers: { "content-type": request.headers.get("content-type")! },
    }).formData();
  } catch (error) {
    if (error instanceof IngestionError) throw error;
    throw new IngestionError(
      "invalid_request",
      "The upload was incomplete or unreadable. Your input is unchanged; try again.",
      400,
    );
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
