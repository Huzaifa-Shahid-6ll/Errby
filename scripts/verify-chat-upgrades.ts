import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { createAdminClient } from "../src/lib/db/admin";
import { syntheticPdf } from "../src/lib/ingestion/synthetic-pdf";
import { extractPdf } from "../src/lib/ingestion/server";
import {
  persistDocument,
  readDocument,
  downloadDocument,
  deleteDocument,
  documentPreparation,
  sessionSources,
} from "../src/lib/documents/service";
import { enterChat } from "../src/lib/chat/entry";
import { getSession } from "../src/lib/sessions/service";
import { handleSessionHelp } from "../src/lib/sessions/help";
import { operate } from "./operations";

// Explicit synthetic hosted acceptance, never part of npm test. Paid calls use
// the existing reservation gate; this script never raises or resets its budget.
assert.equal(process.env.ERRBY_OPERATOR_CONFIRM, "synthetic-test-project");
assert.equal(process.env.ERRBY_MODE, "live");
const owner = process.env.HACKATHON_LEARNER_ID;
assert(owner);
const db = createAdminClient();
const actor = { id: owner, role: "learner" as const, grade: "middle_school" };
const artifact = ".env.chat-upgrades-verification.json";
type Record = {
  openingKey: string;
  notesKey: string;
  document?: string;
  session?: string;
  opening?: string;
  help?: string;
  complete?: boolean;
  before?: unknown;
  after?: unknown;
};
assert(
  !existsSync(artifact) || process.argv.includes("--resume"),
  "Use --resume to reuse the existing verification identities.",
);
const saved: Record = existsSync(artifact)
  ? JSON.parse(readFileSync(artifact, "utf8"))
  : { openingKey: randomUUID(), notesKey: randomUUID() };
const persist = () => writeFileSync(artifact, JSON.stringify(saved, null, 2));
persist();
const status = await operate(db, { action: "status" }, false);
assert("budget" in status && status.budget?.enabled);
assert(
  Number(status.budget.cap_usd) <= 1 &&
    Number(status.budget.max_call_usd) <= 0.03,
);
assert.equal(
  status.unresolved?.length,
  0,
  "Resolve uncertain earlier calls before live verification.",
);
saved.before ??= status;
persist();
if (saved.complete) {
  console.log("Previously completed synthetic verification; no new calls.");
  process.exit(0);
}
try {
  const bytes = syntheticPdf([
    "Synthetic adult software test. Heat transfers from a warmer object to a cooler object. A warm room transfers energy to colder ice. Insulation slows heat transfer; it does not create cold.",
    "A wrapped ice cube melts more slowly because less energy reaches it each second. During melting of pure ice at constant pressure, added energy changes solid ice into liquid water while temperature stays constant until melting finishes.",
  ]);
  const extraction = await extractPdf(bytes, "application/pdf");
  const bucket = await db.storage.getBucket("source-documents");
  assert.ifError(bucket.error);
  assert.equal(bucket.data?.public, false);
  if (!saved.document) {
    saved.document = await persistDocument(
      db,
      owner,
      new File([bytes], "synthetic-heat-verification.pdf", {
        type: "application/pdf",
      }),
      bytes,
      extraction,
    );
    persist();
  }
  const document = await readDocument(db, owner, saved.document);
  assert.deepEqual(document.extraction.pages, extraction.pages);
  const download = await downloadDocument(db, owner, saved.document);
  assert.equal(download.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(new Uint8Array(await download.arrayBuffer()), bytes);
  for (const action of [readDocument, downloadDocument, deleteDocument])
    await assert.rejects(() => action(db, randomUUID(), saved.document!));
  const publicRead = await fetch(
    `${process.env.SUPABASE_URL}/storage/v1/object/public/source-documents/${owner}/${saved.document}.pdf`,
  );
  assert(!publicRead.ok, "Private original must not have a public download.");
  const excerpt = await documentPreparation(
    db,
    actor,
    saved.document,
    "excerpt",
    "Edited synthetic notes about insulation.",
  );
  assert.equal(excerpt.extraction.document_mode, "excerpt");
  assert.equal(excerpt.extraction.kind, "text");
  console.log(
    "Hosted Storage: private original round-trip, foreign-owner denial, public denial and excerpt provenance passed.",
  );

  if (!saved.opening) {
    let streamed = "";
    const reply = await enterChat(
      db,
      actor,
      {
        key: saved.openingKey,
        text: "I want to teach you how insulation slows heat transfer.",
        notes: false,
        history: [],
      },
      undefined,
      (event) => {
        if (event.type === "delta") streamed += event.text;
      },
    );
    assert("reply" in reply && reply.reply);
    assert.equal(streamed, reply.reply);
    saved.opening = reply.reply;
    persist();
    console.log("Actual provider opening stream matched its finalized reply.");
  }
  if (!saved.session) {
    const reply = await enterChat(db, actor, {
      key: saved.notesKey,
      text: extraction.text.slice(0, 8000),
      notes: true,
      history: [],
      document_id: saved.document,
      source_mode: "full",
    });
    assert(
      "session_id" in reply && reply.session_id,
      "Synthetic source did not produce a ready practice session.",
    );
    saved.session = reply.session_id;
    persist();
    console.log(
      "Actual provider preparation created a private source-backed practice session.",
    );
  }
  const before = await getSession(db, actor, saved.session);
  assert.equal(before.session.status, "awaiting_student");
  const sourceBefore = await sessionSources(db, owner, saved.session);
  assert(
    sourceBefore.some(
      (source) =>
        source.document_id === saved.document &&
        source.mode === "full" &&
        source.references.some((reference) => reference.index !== null),
    ),
  );
  if (!saved.help) {
    const response = await handleSessionHelp(
      new Request(`http://127.0.0.1:3100/api/sessions/${saved.session}/help`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://127.0.0.1:3100",
        },
        body: JSON.stringify({
          expected_sequence: before.session.last_sequence,
        }),
      }),
      async () => ({ db, actor }),
      saved.session,
    );
    const payload = await response.json();
    assert.equal(response.status, 200, payload.user_message);
    assert.equal(typeof payload.question, "string");
    saved.help = payload.question;
    persist();
  }
  assert.deepEqual(
    await getSession(db, actor, saved.session),
    before,
    "Help changed saved learning state.",
  );
  await deleteDocument(db, owner, saved.document);
  await assert.rejects(() => readDocument(db, owner, saved.document!));
  const sourceAfter = await sessionSources(db, owner, saved.session);
  assert(sourceAfter.every((source) => source.document_id === null));
  assert.deepEqual(
    sourceAfter.map((source) => source.references),
    sourceBefore.map((source) => source.references),
  );
  // Storage edge invalidation can lag removal. App downloads already fail closed
  // through the deleted owner metadata; allow up to 60 seconds for the edge.
  let gone = false;
  for (let attempt = 0; attempt < 13; attempt++) {
    const removed = await db.storage
      .from("source-documents")
      .download(`${owner}/${saved.document}.pdf`);
    if (removed.error && !removed.data) {
      gone = true;
      break;
    }
    if (attempt < 12) await delay(5000);
  }
  assert(
    gone,
    "Storage still serves deleted bytes after the invalidation window.",
  );
  saved.complete = true;
  console.log(
    "Simpler wording preserved saved learning state; original deletion retained lesson excerpts and removed Storage bytes.",
  );
} catch (error) {
  console.error(
    "Synthetic verification failed:",
    error instanceof Error ? error.message : "Unknown failure",
  );
  process.exitCode = 1;
} finally {
  saved.after = await operate(db, { action: "status" }, false);
  persist();
  console.log("Budget status:", JSON.stringify(saved.after));
}
