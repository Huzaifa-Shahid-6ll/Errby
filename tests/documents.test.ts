import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clarify,
  extractText,
  IngestionError,
} from "../src/lib/ingestion/server";
import {
  deleteAccountDocuments,
  deleteDocument,
  documentPreparation,
  downloadDocument,
  readDocument,
  reconcileDocument,
  sessionSources,
  persistDocument,
} from "../src/lib/documents/service";
import { handleDocumentRequest } from "../src/lib/documents/request";
import { exampleLessons } from "../src/lib/lessons/examples";
import { operate } from "../scripts/operations";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const extraction = {
  ...extractText("Fictional document full text", "text"),
  kind: "pdf" as const,
  pages: [
    { page: 1, text: "Fictional page one." },
    { page: 2, text: "Fictional page two." },
  ],
};

test("PGlite only: private original reservations cap per owner, deny deleted accounts and preserve document/page source attribution", async () => {
  const sql = new PGlite();
  try {
    await sql.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('sub','user_' || replace(current_setting('request.jwt.claim.sub',true),'-',''),'iss','https://synthetic.clerk.accounts.dev','role','authenticated')$$;grant usage on schema auth,public to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
    );
    for (const file of readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await sql.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    for (const n of [1, 2]) {
      await sql.query("insert into auth.users values($1)", [id(n)]);
      await sql.query(
        "insert into profiles(auth_user_id,alias) values($1,'Synthetic owner')",
        [id(n)],
      );
      await sql.query(
        "insert into clerk_identities(user_id,clerk_user_id,issuer) values($1,$2,'https://synthetic.clerk.accounts.dev')",
        [id(n), `user_${n}`],
      );
    }
    await sql.exec("set role service_role");
    const reserve = (owner: number, document: number) =>
      sql.query("select reserve_document($1,$2,'fictional.pdf','pdf',42,$3)", [
        id(owner),
        id(document),
        extraction,
      ]);
    for (let n = 100; n < 120; n++) await reserve(1, n);
    await assert.rejects(reserve(1, 120), /document_limit/);
    await reserve(2, 120);
    await sql.query(
      "update clerk_identities set deletion_requested_at=now() where user_id=$1",
      [id(2)],
    );
    await assert.rejects(reserve(2, 121), /document_forbidden/);
    const result = clarify(
      { ...extraction, document_id: id(100), document_mode: "full" },
      { subject: "Fiction", grade: "Grade 7", scope: "Read two pages" },
    );
    const preparation = await sql.query<{ source_id: string }>(
      "select (create_preparation($1,null,$2,$3,$4)).source_id",
      [id(1), id(200), "a".repeat(64), result],
    );
    const source = await sql.query<{ provenance: { document_id: string } }>(
      "select provenance from source_documents where id=$1",
      [preparation.rows[0].source_id],
    );
    assert.equal(source.rows[0].provenance.document_id, id(100));
    const chunks = await sql.query<{
      text: string;
      location: { page: number };
    }>(
      "select text,location from source_chunks where source_id=$1 order by ordinal",
      [preparation.rows[0].source_id],
    );
    assert.deepEqual(
      chunks.rows.map((r) => ({ page: r.location.page, text: r.text })),
      extraction.pages,
    );
    await sql.exec("set role authenticated");
    await assert.rejects(
      sql.query("select * from uploaded_documents"),
      /permission denied/,
    );
    await assert.rejects(reserve(1, 122), /permission denied/);
  } finally {
    await sql.close();
  }
});

function storageMock() {
  const rows = [
    {
      id: id(10),
      owner_id: id(1),
      name: "Fictional.pdf",
      kind: "pdf",
      bytes: 4,
      state: "ready",
      storage_path: `${id(1)}/${id(10)}.pdf`,
      created_at: "2026-10-01T00:00:00Z",
      extraction,
    },
  ];
  const removed: string[] = [];
  let removalFails = false;
  let downloadCalls = 0;
  const db = {
    from(table: string) {
      assert.equal(table, "uploaded_documents");
      const filters: [string, unknown][] = [];
      let update: Record<string, unknown> | undefined;
      let deleting = false;
      const query = {
        select() {
          return query;
        },
        eq(key: string, value: unknown) {
          filters.push([key, value]);
          return query;
        },
        update(value: Record<string, unknown>) {
          update = value;
          return query;
        },
        delete() {
          deleting = true;
          return query;
        },
        run() {
          const matches = rows.filter((row) =>
            filters.every(
              ([key, value]) => row[key as keyof typeof row] === value,
            ),
          );
          if (update) matches.forEach((row) => Object.assign(row, update));
          if (deleting)
            matches.forEach((row) => rows.splice(rows.indexOf(row), 1));
          return { data: matches, error: null };
        },
        async maybeSingle() {
          return { ...query.run(), data: query.run().data[0] ?? null };
        },
        then<T>(resolve: (value: { data: typeof rows; error: null }) => T) {
          return Promise.resolve(resolve(query.run()));
        },
      };
      return query;
    },
    storage: {
      from(name: string) {
        assert.equal(name, "source-documents");
        return {
          async download(path: string) {
            downloadCalls++;
            assert.equal(path, rows[0].storage_path);
            return { data: new Blob(["test"]), error: null };
          },
          async remove(paths: string[]) {
            if (removalFails) return { error: { message: "offline" } };
            removed.push(...paths);
            return { error: null };
          },
        };
      },
    },
  } as unknown as SupabaseClient;
  return {
    db,
    rows,
    removed,
    setRemovalFailure: () => {
      removalFails = true;
    },
    downloads: () => downloadCalls,
  };
}

test("document references preserve server pages; edited excerpts never inherit original page locations", async () => {
  const { db } = storageMock();
  const actor = { id: id(1), role: "learner" as const, grade: "Grade 7" };
  const full = await documentPreparation(
    db,
    actor,
    id(10),
    "full",
    "forged page text",
  );
  assert.deepEqual(full.extraction.pages, extraction.pages);
  assert.equal(full.extraction.document_mode, "full");
  const edited = await documentPreparation(
    db,
    actor,
    id(10),
    "excerpt",
    "Edited fictional explanation",
  );
  assert.equal(edited.extraction.kind, "text");
  assert.equal(edited.extraction.document_mode, "excerpt");
  assert.equal(edited.extraction.document_id, id(10));
  assert.deepEqual(edited.extraction.pages, [
    { page: 1, text: "Edited fictional explanation" },
  ]);
  await assert.rejects(
    readDocument(db, id(2), id(10)),
    (error: unknown) => error instanceof IngestionError && error.status === 404,
  );
});

test("private download never reaches Storage for foreign owner; deletion failures retain retry metadata and pending writes block account cleanup", async () => {
  const store = storageMock();
  await assert.rejects(downloadDocument(store.db, id(2), id(10)));
  assert.equal(store.downloads(), 0);
  const response = await downloadDocument(store.db, id(1), id(10));
  assert.equal(await response.text(), "test");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.match(response.headers.get("content-disposition")!, /^attachment;/);
  store.rows[0].state = "uploading";
  await assert.rejects(
    deleteAccountDocuments(store.db, id(1)),
    /upload is still finishing/,
  );
  assert.equal(store.removed.length, 0);
  store.rows[0].state = "ready";
  store.setRemovalFailure();
  await assert.rejects(deleteDocument(store.db, id(1), id(10)));
  assert.equal(store.rows.length, 1);
  assert.equal(store.rows[0].state, "deleting");
  const healthy = storageMock();
  await deleteAccountDocuments(healthy.db, id(1));
  assert.equal(healthy.rows.length, 0);
  assert.deepEqual(healthy.removed, [`${id(1)}/${id(10)}.pdf`]);
});

test("document HTTP rejects cross-origin deletion, unavailable identity and invalid links without storage access", async () => {
  const store = storageMock();
  const access = async () => ({ db: store.db, owner: id(1) });
  const denied = await handleDocumentRequest(
    new Request("http://localhost/api/documents/" + id(10), {
      method: "DELETE",
      headers: { origin: "https://elsewhere.invalid" },
    }),
    access,
    id(10),
  );
  assert.equal(denied.status, 403);
  assert.equal(store.rows.length, 1);
  const invalid = await handleDocumentRequest(
    new Request("http://localhost/api/documents/no"),
    access,
    "no",
  );
  assert.equal(invalid.status, 400);
  const unsigned = await handleDocumentRequest(
    new Request("http://localhost/api/documents"),
    async () => {
      throw new IngestionError("unauthenticated", "Sign in", 401);
    },
  );
  assert.equal(unsigned.status, 401);
  assert.equal(unsigned.headers.get("cache-control"), "private, no-store");
});

test("source citations gate archived/revoked sessions before reads and recheck after projections", async () => {
  let reads = 0;
  let gates = 0;
  let denyAt = 1;
  const db = {
    async rpc(name: string) {
      assert.equal(name, "assert_learning_session_access");
      gates++;
      return {
        error: gates >= denyAt ? { message: "session_not_found" } : null,
      };
    },
    from(table: string) {
      reads++;
      const query = {
        select() {
          return query;
        },
        eq() {
          return query;
        },
        async maybeSingle() {
          return {
            error: null,
            data:
              table === "sessions"
                ? { lesson_version_id: id(30) }
                : table === "lesson_versions"
                  ? { lesson_json: exampleLessons[0] }
                  : null,
          };
        },
        single() {
          return query.maybeSingle();
        },
      };
      return query;
    },
  } as unknown as SupabaseClient;
  await assert.rejects(sessionSources(db, id(1), id(10)), /unavailable/);
  assert.equal(reads, 0);
  gates = 0;
  denyAt = 2;
  await assert.rejects(sessionSources(db, id(1), id(10)), /unavailable/);
  assert.equal(gates, 2);
  assert.ok(reads > 0);
});

test("operator upload cleanup requires confirmation and safe age, fences before removing the original", async () => {
  const store = storageMock();
  store.rows[0].state = "uploading";
  store.rows[0].created_at = new Date().toISOString();
  await assert.rejects(
    reconcileDocument(store.db, id(1), id(10)),
    /five minutes/,
  );
  const command = {
    action: "document-reconcile",
    ownerId: id(1),
    documentId: id(10),
    confirmDocumentId: id(10),
    confirmedNoActiveWriter: true,
  };
  await assert.rejects(operate(store.db, command, false), /requires --confirm/);
  await assert.rejects(
    operate(store.db, { ...command, confirmedNoActiveWriter: false }, true),
  );
  await assert.rejects(
    operate(store.db, { ...command, confirmDocumentId: id(11) }, true),
    /does not match/,
  );
  assert.equal(store.removed.length, 0);
  store.rows[0].created_at = new Date(Date.now() - 6 * 60_000).toISOString();
  assert.deepEqual(await operate(store.db, command, true), {
    status: "original_deleted",
    documentId: id(10),
  });
  assert.equal(store.rows.length, 0);
  assert.equal(store.removed.length, 1);
});

test("failed upload cleanup remains visible as retryable failed metadata", async () => {
  const states: string[] = [];
  const db = {
    async rpc() {
      return { error: null };
    },
    from() {
      const query = {
        update(value: { state: string }) {
          states.push(value.state);
          return query;
        },
        eq() {
          return query;
        },
        select() {
          return query;
        },
        async single() {
          return { error: { message: "offline" }, data: null };
        },
        then<T>(resolve: (value: { error: null }) => T) {
          return Promise.resolve(resolve({ error: null }));
        },
      };
      return query;
    },
    storage: {
      from() {
        return {
          async upload() {
            return { error: null };
          },
          async remove() {
            return { error: { message: "offline" } };
          },
        };
      },
    },
  } as unknown as SupabaseClient;
  await assert.rejects(
    persistDocument(
      db,
      id(1),
      new File(["test"], "Fictional.pdf"),
      new TextEncoder().encode("test"),
      extraction,
    ),
  );
  assert.deepEqual(states, ["ready", "failed"]);
});
