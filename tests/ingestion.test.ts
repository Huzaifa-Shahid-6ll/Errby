import assert from "node:assert/strict";
import test from "node:test";
import { INGESTION_LIMITS } from "../src/lib/ingestion/contracts";
import {
  acceptPastedText,
  boundedFormData,
  clarify,
  extractDocx,
  extractPdf,
  extractResource,
  extractText,
  IngestionError,
} from "../src/lib/ingestion/server";
import { handlePreparation } from "../src/lib/ingestion/request";
import { demoPdfPages, syntheticPdf } from "../src/lib/ingestion/synthetic-pdf";

function hasCode(code: string) {
  return (error: unknown) =>
    error instanceof IngestionError && error.code === code;
}
function request(
  fields: Record<string, string | Blob>,
  origin = "http://localhost",
) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return new Request("http://localhost/prepare/extract", {
    method: "POST",
    headers: { origin },
    body: form,
  });
}
const noIdentity = async () => null;

test("DOCX extraction preserves paragraph sections and rejects corrupt input", async () => {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/document.xml",
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Heat transfer</w:t></w:r></w:p><w:p><w:r><w:t>Conduction</w:t></w:r></w:p></w:body></w:document>',
  );
  const bytes = await zip.generateAsync({ type: "uint8array" });
  const mime =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const source = await extractDocx(bytes, mime);
  assert.equal(source.kind, "docx");
  assert.deepEqual(
    source.pages.map((p) => p.text),
    ["Heat transfer", "Conduction"],
  );
  assert.match(source.text, /\[Section 1\]/);
  assert.match(source.parser, /^mammoth\//);
  assert.equal(source.provenance, "user_supplied_unreviewed");
  for (const [content, code] of [
    ["<w:p><w:r><w:t>Section</w:t></w:r></w:p>".repeat(51), "too_many_pages"],
    [
      `<w:p><w:r><w:t>${"x".repeat(30_001)}</w:t></w:r></w:p>`,
      "too_many_characters",
    ],
  ]) {
    zip.file(
      "word/document.xml",
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${content}</w:body></w:document>`,
    );
    await assert.rejects(
      extractDocx(await zip.generateAsync({ type: "uint8array" }), mime),
      hasCode(code),
    );
  }
  await assert.rejects(
    extractDocx(new Uint8Array([80, 75, 3, 4]), mime),
    hasCode("unreadable_docx"),
  );
});
test("resource links record context only after permitted text is supplied", () => {
  assert.throws(
    () => extractResource("https://www.youtube.com/watch?v=abc", ""),
    hasCode("link_needs_text"),
  );
  assert.throws(
    () => extractResource("http://example.org", "Transcript"),
    hasCode("invalid_link"),
  );
  const source = extractResource(
    "https://example.org/watch",
    "Pasted transcript",
  );
  assert.equal(source.source_url, "https://example.org/watch");
  assert.equal(source.text, "Pasted transcript");
  assert.match(source.warnings[0], /not fetched or watched/);
});

test("text is bounded; sparse topic uses existing level and never becomes factual evidence", () => {
  assert.throws(() => acceptPastedText(" "), hasCode("invalid_text"));
  assert.throws(
    () => acceptPastedText("x".repeat(30_001)),
    hasCode("invalid_text"),
  );
  assert.throws(
    () => extractText("https://youtube.com/watch?v=fictional", "topic"),
    hasCode("link_needs_text"),
  );
  const source = extractText("Grade 7: heat, cells, fractions", "topic");
  const result = clarify(source, {});
  assert.equal(source.source_role, "scope");
  assert.equal(source.provenance, "user_supplied_unreviewed");
  assert.equal(result.context.grade, "Grade 7");
  assert.deepEqual(
    result.questions.map((q) => q.field),
    ["subject", "scope"],
  );
  assert.equal(clarify(extractText("Heat", "topic"), {}).questions.length, 3);
  assert.equal(
    clarify(source, {}, "middle_school").context.grade,
    "middle_school",
  );
  assert.equal(
    clarify(source, { grade: "Grade 8" }, "middle_school").context.grade,
    "Grade 8",
  );
  assert.equal(
    clarify(source, {
      subject: "Science",
      grade: "Grade 7",
      scope: "Energy transfer",
    }).status,
    "extracted_needs_review",
  );
  assert.throws(
    () => clarify(source, { scope: "x".repeat(1_001) }),
    hasCode("invalid_context"),
  );
});

test("real PDF parsing preserves pages/hash and reports missing text without approving partial extraction", async () => {
  const bytes = syntheticPdf([demoPdfPages[0], "", demoPdfPages[1]]);
  const source = await extractPdf(bytes, "application/pdf");
  assert.equal(source.pages[0].text, demoPdfPages[0]);
  assert.equal(source.pages[2].text, demoPdfPages[1]);
  assert.match(source.text, /\[Page 2\]\n\[No extractable text\]/);
  assert.deepEqual(source.coverage, {
    total_pages: 3,
    text_pages: 2,
    missing_pages: [2],
  });
  assert.match(source.sha256, /^[a-f0-9]{64}$/);
  assert.equal(source.parser, "pdfjs-dist/6.3.289");
  assert.equal(clarify(source, {}).status, "partial");
  assert.ok(source.warnings.some((warning) => warning.includes("partial")));
  assert.equal(
    (await extractPdf(bytes, "application/pdf")).sha256,
    source.sha256,
  );
});

test("PDF validation/recovery rejects wrong type, signature, empty, scanned, corrupt, encrypted and oversized sources", async () => {
  const bytes = syntheticPdf(["Fictional text"]);
  await assert.rejects(
    extractPdf(bytes, "text/plain"),
    hasCode("unsupported_file"),
  );
  await assert.rejects(
    extractPdf(new TextEncoder().encode("<html>not PDF"), "application/pdf"),
    hasCode("unsupported_file"),
  );
  await assert.rejects(
    extractPdf(new Uint8Array(), "application/pdf"),
    hasCode("empty_file"),
  );
  await assert.rejects(
    extractPdf(new Uint8Array(INGESTION_LIMITS.bytes + 1), "application/pdf"),
    hasCode("too_large"),
  );
  await assert.rejects(
    extractPdf(syntheticPdf([""]), "application/pdf"),
    hasCode("no_text"),
  );
  await assert.rejects(
    extractPdf(
      new TextEncoder().encode("%PDF-1.7\ncorrupt"),
      "application/pdf",
    ),
    hasCode("unreadable_pdf"),
  );
  const encrypted = Buffer.from(bytes)
    .toString()
    .replace(
      "/Root 1 0 R >>",
      `/Root 1 0 R /Encrypt << /Filter /Standard /V 1 /R 2 /O <${"00".repeat(32)}> /U <${"00".repeat(32)}> /P -4 >> /ID [<${"00".repeat(16)}><${"00".repeat(16)}>] >>`,
    );
  await assert.rejects(
    extractPdf(new Uint8Array(Buffer.from(encrypted)), "application/pdf"),
    hasCode("encrypted_pdf"),
  );
  await assert.rejects(
    extractPdf(
      syntheticPdf(Array.from({ length: 51 }, () => "Text")),
      "application/pdf",
    ),
    hasCode("too_many_pages"),
  );
  await assert.rejects(
    extractPdf(
      syntheticPdf(
        Array.from({ length: 40 }, () =>
          ("Fictional text ".repeat(6) + "\n").repeat(20),
        ),
      ),
      "application/pdf",
    ),
    hasCode("too_many_characters"),
  );
});

test("parser has a real cancellation deadline and releases admission after termination", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const pending = extractPdf(
    syntheticPdf(["Fictional text"]),
    "application/pdf",
  );
  const rejected = assert.rejects(pending, hasCode("parser_timeout"));
  await assert.rejects(
    extractPdf(syntheticPdf(["Second"]), "application/pdf"),
    hasCode("parser_busy"),
  );
  t.mock.timers.tick(INGESTION_LIMITS.milliseconds);
  await rejected;
  t.mock.timers.reset();
  assert.equal(
    (await extractPdf(syntheticPdf(["Recovered"]), "application/pdf")).pages[0]
      .text,
    "Recovered",
  );
});

test("request gate denies cross-origin/demo uploads and verifies live identity before consuming body", async () => {
  const oversized = await handlePreparation(
    request({
      kind: "pdf",
      file: new Blob([new Uint8Array(4 * 1024 * 1024 + 1)], {
        type: "application/pdf",
      }),
    }),
    "live",
    async () => ({ grade: "middle_school" }),
    4 * 1024 * 1024,
  );
  assert.equal(oversized.status, 413);
  assert.match((await oversized.json()).user_message, /4 MiB/);
  const unauthorized = request({
    kind: "pdf",
    file: new Blob([syntheticPdf(demoPdfPages)], { type: "application/pdf" }),
  });
  const denied = await handlePreparation(unauthorized, "live", noIdentity);
  assert.equal(denied.status, 401);
  assert.equal(unauthorized.bodyUsed, false);
  const crossOrigin = request(
    { kind: "topic", text: "Fictional" },
    "https://attacker.invalid",
  );
  assert.equal(
    (await handlePreparation(crossOrigin, "demo", noIdentity)).status,
    403,
  );
  assert.equal(crossOrigin.bodyUsed, false);
  const canonicalUrl = request(
    { kind: "topic", text: "Fictional topic" },
    "http://127.0.0.1:3200",
  );
  canonicalUrl.headers.set("host", "127.0.0.1:3200");
  assert.equal(
    (await handlePreparation(canonicalUrl, "demo", noIdentity)).status,
    200,
  );
  const wrongHost = request({ kind: "topic", text: "Fictional topic" });
  wrongHost.headers.set("host", "other.invalid");
  assert.equal(
    (await handlePreparation(wrongHost, "demo", noIdentity)).status,
    403,
  );
  const demo = await handlePreparation(
    request({
      kind: "pdf",
      file: new Blob([syntheticPdf(demoPdfPages)], { type: "application/pdf" }),
    }),
    "demo",
    noIdentity,
  );
  assert.equal((await demo.json()).error_code, "demo_upload_disabled");
  const input = request({ kind: "topic", text: "Fictional heat" });
  const original = await input.clone().formData();
  const response = await handlePreparation(input, "live", async () => ({
    grade: "middle_school",
  }));
  const result = await response.json();
  assert.equal(result.context.grade, "middle_school");
  assert.equal(result.extraction.text, original.get("text"));
  assert.equal(response.headers.get("cache-control"), "no-store");
  const uploaded = await handlePreparation(
    request({
      kind: "pdf",
      file: new Blob([syntheticPdf(demoPdfPages)], {
        type: "application/pdf",
      }),
    }),
    "live",
    async () => ({ grade: "middle_school" }),
  );
  const uploadedResult = await uploaded.json();
  assert.equal(uploaded.status, 200);
  assert.equal(uploadedResult.extraction.pages[0].text, demoPdfPages[0]);
  assert.equal(uploadedResult.extraction.coverage.text_pages, 2);
  assert.equal(
    uploadedResult.extraction.provenance,
    "user_supplied_unreviewed",
  );
  assert.equal(uploadedResult.status, "needs_clarification");
  assert.equal(uploadedResult.context.grade, "middle_school");
  const duplicate = new FormData();
  duplicate.append("kind", "text");
  duplicate.append("kind", "pdf");
  assert.equal(
    (
      await handlePreparation(
        new Request("http://localhost/prepare/extract", {
          method: "POST",
          headers: { origin: "http://localhost" },
          body: duplicate,
        }),
        "demo",
        noIdentity,
      )
    ).status,
    400,
  );
});

test("bounded multipart counts actual bytes without trusting length and returns stable recovery", async () => {
  const oversized = new Request("http://localhost/prepare/extract", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=test" },
    body: "x".repeat(200),
  });
  oversized.headers.set("content-length", "1");
  await assert.rejects(boundedFormData(oversized, 100), hasCode("too_large"));
  const malformed = new Request("http://localhost/prepare/extract", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=test" },
    body: "broken",
  });
  await assert.rejects(
    boundedFormData(malformed, 1_000),
    hasCode("invalid_request"),
  );
  const invalid = await handlePreparation(
    request({ kind: "topic", text: "" }),
    "demo",
    noIdentity,
  );
  assert.equal((await invalid.json()).error_code, "invalid_text");
  const success = await handlePreparation(
    request({ kind: "sample" }),
    "demo",
    noIdentity,
  );
  const parsed = await success.json();
  assert.equal(success.status, 200);
  assert.equal(parsed.extraction.provenance, "fictional_unreviewed");
  assert.equal(parsed.extraction.coverage.text_pages, 2);
});
