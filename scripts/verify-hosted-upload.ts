import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import JSZip from "jszip";
import { syntheticPdf } from "../src/lib/ingestion/synthetic-pdf";

// Run with --conditions=react-server, both private env files and the production server.
assert.equal(process.env.ERRBY_OPERATOR_CONFIRM, "synthetic-test-project");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:3100/setup");
  await page
    .getByLabel("Student username or teacher email")
    .fill(process.env.HACKATHON_TEACHER_EMAIL!);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.HACKATHON_TEACHER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/learn");
  const text =
    "Synthetic adult test document. Heat moves from a warmer object to a cooler object. Insulation slows the transfer of heat.";
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "word/document.xml",
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`,
  );
  const documents = [
    { kind: "pdf", mime: "application/pdf", bytes: syntheticPdf([text]) },
    {
      kind: "docx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      bytes: await zip.generateAsync({ type: "uint8array" }),
    },
  ];
  for (const document of documents) {
    const result = await page.evaluate(
      async ({ kind, mime, bytes, classId }) => {
        const form = new FormData();
        form.set("kind", kind);
        form.set(
          "file",
          new Blob([new Uint8Array(bytes)], { type: mime }),
          `synthetic.${kind}`,
        );
        form.set("subject", "Science");
        form.set("grade", "middle_school");
        form.set("scope", "Synthetic adult upload verification");
        const response = await fetch("/api/preparations", {
          method: "POST",
          headers: {
            "idempotency-key": crypto.randomUUID(),
            "x-errby-class-id": classId,
          },
          body: form,
        });
        const body = await response.json();
        return {
          status: response.status,
          kind: body.job?.partial_results?.extraction?.kind,
          text: body.job?.partial_results?.extraction?.text,
          error: body.error_code,
        };
      },
      {
        ...document,
        bytes: [...document.bytes],
        classId: process.env.HACKATHON_CLASS_ID!,
      },
    );
    assert.equal(result.status, 201, result.error);
    assert.equal(result.kind, document.kind);
    assert(result.text.includes("Synthetic adult test document"));
    console.log(
      `Production authenticated ${document.kind} upload, extraction and hosted persistence passed`,
    );
  }
} finally {
  await browser.close();
}
