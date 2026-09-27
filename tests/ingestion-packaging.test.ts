import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import JSZip from "jszip";

// Run after npm run build: only traced files may satisfy the worker's imports.
test("production ingestion traces contain a usable DOCX parser and its dependencies", async () => {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "word/document.xml",
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Fictional packaging check</w:t></w:r></w:p></w:body></w:document>',
  );
  for (const route of ["api/preparations", "prepare/extract"]) {
    const tracePath = path.resolve(
      `.next/server/app/${route}/route.js.nft.json`,
    );
    const trace = JSON.parse(await readFile(tracePath, "utf8")) as {
      files: string[];
    };
    const isolated = await mkdtemp(path.join(tmpdir(), "errby-docx-trace-"));
    try {
      for (const file of trace.files) {
        const source = path.resolve(path.dirname(tracePath), file);
        const relative = path.relative(process.cwd(), source);
        if (!relative.startsWith(`node_modules${path.sep}`)) continue;
        const destination = path.join(isolated, relative);
        await mkdir(path.dirname(destination), { recursive: true });
        await copyFile(source, destination);
      }
      await writeFile(
        path.join(isolated, "source.docx"),
        await zip.generateAsync({ type: "nodebuffer" }),
      );
      const output = execFileSync(
        process.execPath,
        [
          "-e",
          "require('./node_modules/mammoth').extractRawText({path:'source.docx'}).then(result=>process.stdout.write(result.value)).catch(()=>process.exit(1))",
        ],
        { cwd: isolated, encoding: "utf8", timeout: 30_000 },
      );
      assert.equal(output.trim(), "Fictional packaging check", route);
    } finally {
      await rm(isolated, { recursive: true, force: true });
    }
  }
});
