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
  advancePreparation,
  createPreparation,
  readPreparation,
  validateDraft,
  type PreparationActor,
} from "../src/lib/preparations/service";
import { handleDurablePreparation } from "../src/lib/preparations/request";
import type { PreparationJob } from "../src/lib/preparations/contracts";
import type { Lesson } from "../src/lib/lessons/schema";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const teacher: PreparationActor = {
  id: id(1),
  role: "teacher",
  grade: "middle_school",
};
const learner: PreparationActor = {
  id: id(3),
  role: "learner",
  grade: "middle_school",
};
const result = () =>
  clarify(
    extractText("Fictional source: a triangle has three sides.", "text"),
    { subject: "Math", grade: "Grade 7", scope: "Explain triangles" },
  );
const hasCode = (code: string) => (error: unknown) =>
  error instanceof IngestionError && error.code === code;
function draftFor(job: PreparationJob): Lesson {
  return {
    schema_version: "1.1",
    id: "triangle",
    version: 1,
    title: "Fictional triangles draft",
    grade_band: "Grade 7",
    language: "en",
    content_origin: "human_authored",
    illustrative_only: true,
    initial_question: "How would you describe a triangle?",
    application_question: "Explain a different triangle.",
    sources: [
      {
        id: job.source_id,
        title: "Fictional source",
        kind: "text",
        url: null,
        provenance: "unreviewed",
      },
    ],
    references: [
      {
        id: "ref",
        source_id: job.source_id,
        location: { kind: "page", index: 1 },
        text: "a triangle has three sides.",
        text_kind: "excerpt",
        purpose: "evidence",
        status: "unverified",
      },
    ],
    objectives: [
      {
        id: "sides",
        title: "Triangle sides",
        required: true,
        criteria: ["Explain three sides."],
        acceptable_explanations: ["A triangle has three sides."],
        essential_facts: ["Three sides."],
        correction_criteria: ["Identify three sides."],
        reference_ids: ["ref"],
        misconceptions: [],
        follow_up_questions: ["How many sides?"],
        application_question: "Draw a triangle.",
        unresolved_issues: ["Teacher review pending."],
      },
    ],
    teacher_review: { status: "pending" },
  };
}

test("PGlite only: durable source, owner/class isolation, idempotency, expiring leases, stale-worker fencing and immutable unreviewed snapshots", async () => {
  const sql = new PGlite();
  try {
    await sql.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
    );
    for (const file of readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await sql.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    for (let n = 1; n <= 4; n++) {
      await sql.query("insert into auth.users values($1)", [id(n)]);
      await sql.query(
        "insert into public.profiles(auth_user_id,role,alias) values($1,$2,'Synthetic account')",
        [id(n), n <= 2 ? "teacher" : "learner"],
      );
    }
    for (let n = 1; n <= 2; n++)
      await sql.query(
        "insert into public.classes(id,teacher_id,title,grade_band,join_code_hash) values($1,$2,'Synthetic class','middle_school',$3)",
        [id(10 + n), id(n), `synthetic-${n}`],
      );
    // This adapter executes actual SQL via PGlite. It is NOT Supabase HTTP/Auth/JWT verification.
    const functions: Record<string, string[]> = {
      check_preparation_owner: ["p_owner", "p_class"],
      create_preparation: ["p_owner", "p_class", "p_key", "p_hash", "p_result"],
      claim_preparation: ["p_owner", "p_job", "p_step"],
      finish_preparation: [
        "p_owner",
        "p_job",
        "p_token",
        "p_result",
        "p_lesson",
        "p_content_hash",
        "p_request_hash",
      ],
      fail_preparation: ["p_owner", "p_job", "p_token"],
    };
    const db = {
      async rpc(name: string, args: Record<string, unknown>) {
        try {
          assert.ok(functions[name]);
          const values = functions[name].map((key) => args[key] ?? null);
          const data = await sql.query<{ value: unknown }>(
            `select to_jsonb(public.${name}(${values.map((_, i) => `$${i + 1}`).join(",")})) as value`,
            values,
          );
          return { data: data.rows[0].value, error: null };
        } catch (error) {
          return { data: null, error: { message: (error as Error).message } };
        }
      },
      from(table: string) {
        assert.ok(["preparation_jobs", "lesson_versions"].includes(table));
        const values: unknown[] = [];
        const filters: string[] = [];
        const query = {
          select() {
            return query;
          },
          eq(column: string, value: unknown) {
            assert.match(column, /^[a-z_]+$/);
            values.push(value);
            filters.push(`${column}=$${values.length}`);
            return query;
          },
          async maybeSingle() {
            const data = await sql.query(
              `select * from public.${table} where ${filters.join(" and ")}`,
              values,
            );
            return { data: data.rows[0] ?? null, error: null };
          },
          single() {
            return query.maybeSingle();
          },
        };
        return query;
      },
    } as unknown as SupabaseClient;
    await sql.exec("set role service_role");
    const job = await createPreparation(db, teacher, id(21), id(11), result());
    assert.equal(job.current_step, 0);
    assert.equal("lease_token" in job, false);
    const retry = await createPreparation(
      db,
      teacher,
      id(21),
      id(11),
      result(),
    );
    assert.equal(retry.id, job.id);
    const changed = result();
    changed.context.scope = "Different scope";
    await assert.rejects(
      createPreparation(db, teacher, id(21), id(11), changed),
      hasCode("idempotency_conflict"),
    );
    await assert.rejects(
      createPreparation(db, teacher, id(22), id(12), result()),
      hasCode("preparation_forbidden"),
    );
    await assert.rejects(
      createPreparation(db, learner, id(23), id(11), result()),
      hasCode("preparation_forbidden"),
    );
    assert.equal(
      (await sql.query("select * from public.source_documents")).rows.length,
      1,
    );
    assert.equal(
      (await sql.query("select * from public.source_chunks")).rows.length,
      1,
    );
    assert.equal(
      (
        await sql.query<{ hash: string }>(
          "select hash from public.source_chunks",
        )
      ).rows[0].hash.length,
      64,
    );
    const broken = result();
    broken.extraction.pages.push({ ...broken.extraction.pages[0] });
    await assert.rejects(
      createPreparation(db, teacher, id(24), null, broken),
      hasCode("preparation_storage_unavailable"),
    );
    assert.equal(
      (await sql.query("select * from public.source_documents")).rows.length,
      1,
      "failed transaction must not orphan a source",
    );
    const privateJob = await createPreparation(
      db,
      learner,
      id(25),
      null,
      result(),
    );
    assert.equal(
      (await readPreparation(db, learner, privateJob.id)).can_author,
      false,
    );
    await assert.rejects(
      readPreparation(db, teacher, privateJob.id),
      hasCode("preparation_not_found"),
    );
    await advancePreparation(db, learner, privateJob.id, { expected_step: 0 });
    const deniedImport = new Request(
      `http://localhost/api/preparations/${privateJob.id}/step`,
      {
        method: "POST",
        headers: {
          origin: "http://localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({ expected_step: 1, draft: draftFor(privateJob) }),
      },
    );
    assert.equal(
      (
        await handleDurablePreparation(
          deniedImport,
          async () => ({ db, actor: learner }),
          privateJob.id,
        )
      ).status,
      403,
    );
    const learnerLease = await db.rpc("claim_preparation", {
      p_owner: learner.id,
      p_job: privateJob.id,
      p_step: 1,
    });
    const learnerSqlDenied = await db.rpc("finish_preparation", {
      p_owner: learner.id,
      p_job: privateJob.id,
      p_token: learnerLease.data.lease_token,
      p_result: result(),
      p_lesson: draftFor(privateJob),
      p_content_hash: "a".repeat(64),
      p_request_hash: "a".repeat(64),
    });
    assert.match(learnerSqlDenied.error!.message, /preparation_forbidden/);
    await assert.rejects(
      readPreparation(db, { ...teacher, id: id(2) }, job.id),
      hasCode("preparation_not_found"),
    );
    const first = await db.rpc("claim_preparation", {
      p_owner: teacher.id,
      p_job: job.id,
      p_step: 0,
    });
    assert.equal(first.error, null);
    const busy = await db.rpc("claim_preparation", {
      p_owner: teacher.id,
      p_job: job.id,
      p_step: 0,
    });
    assert.match(busy.error!.message, /preparation_busy/);
    await sql.query(
      "update public.preparation_jobs set lease_until=clock_timestamp()-interval '1 second' where id=$1",
      [job.id],
    );
    const second = await db.rpc("claim_preparation", {
      p_owner: teacher.id,
      p_job: job.id,
      p_step: 0,
    });
    assert.notEqual(first.data.lease_token, second.data.lease_token);
    const stale = await db.rpc("finish_preparation", {
      p_owner: teacher.id,
      p_job: job.id,
      p_token: first.data.lease_token,
      p_result: result(),
      p_request_hash: "a".repeat(64),
    });
    assert.match(stale.error!.message, /lease_lost/);
    await db.rpc("fail_preparation", {
      p_owner: teacher.id,
      p_job: job.id,
      p_token: first.data.lease_token,
    });
    assert.equal(
      (await readPreparation(db, teacher, job.id)).job.status,
      "pending",
    );
    await db.rpc("fail_preparation", {
      p_owner: teacher.id,
      p_job: job.id,
      p_token: second.data.lease_token,
    });
    assert.equal(
      (await readPreparation(db, teacher, job.id)).job.status,
      "failed",
    );
    const advanced = await advancePreparation(db, teacher, job.id, {
      expected_step: 0,
    });
    assert.equal(advanced.job.current_step, 1);
    assert.equal(
      (await advancePreparation(db, teacher, job.id, { expected_step: 0 })).job
        .id,
      job.id,
    );
    await assert.rejects(
      advancePreparation(db, teacher, job.id, {
        expected_step: 0,
        context: changed.context,
      }),
      hasCode("step_conflict"),
    );
    await assert.rejects(
      advancePreparation(db, teacher, job.id, { expected_step: 1 }),
      hasCode("generation_unavailable"),
    );
    const draft = draftFor(advanced.job);
    assert.throws(
      () => validateDraft(draft, advanced.job, learner),
      hasCode("draft_forbidden"),
    );
    const forged = structuredClone(draft);
    forged.teacher_review = {
      status: "approved",
      reviewer_id: teacher.id,
      reviewed_at: new Date().toISOString(),
      lesson_version: 1,
    };
    assert.throws(
      () => validateDraft(forged, advanced.job, teacher),
      hasCode("untrusted_review"),
    );
    const wrong = structuredClone(draft);
    wrong.references[0].text = "Fabricated quote";
    assert.throws(
      () => validateDraft(wrong, advanced.job, teacher),
      hasCode("reference_mismatch"),
    );
    wrong.references[0].text = draft.references[0].text;
    wrong.sources[0].id = id(99);
    assert.throws(() => validateDraft(wrong, advanced.job, teacher));
    const saved = await advancePreparation(db, teacher, job.id, {
      expected_step: 1,
      draft,
    });
    assert.equal(saved.job.status, "needs_review");
    assert.equal(saved.lesson?.teacher_review.status, "pending");
    assert.equal(saved.job.current_step, 2);
    assert.equal(
      (
        await advancePreparation(db, teacher, job.id, {
          expected_step: 1,
          draft,
        })
      ).job.partial_results.lesson_version_id,
      saved.job.partial_results.lesson_version_id,
    );
    await assert.rejects(
      advancePreparation(db, teacher, job.id, {
        expected_step: 1,
        draft: { ...draft, title: "Changed" },
      }),
      hasCode("step_conflict"),
    );
    assert.equal(
      (await sql.query("select * from public.lesson_versions")).rows.length,
      1,
    );
    await assert.rejects(
      sql.exec("update public.lesson_versions set initial_question='Changed'"),
      /immutable/,
    );
    await assert.rejects(
      sql.exec(
        "update public.lesson_versions set review_status='published',reviewed_at=now()",
      ),
      /immutable/,
    );
    assert.equal(
      (
        await sql.query<{ current_published_version: null }>(
          "select current_published_version from public.lessons",
        )
      ).rows[0].current_published_version,
      null,
    );
    await sql.exec("reset role;set role authenticated");
    await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id(2),
    ]);
    assert.equal(
      (await sql.query("select * from public.preparation_jobs")).rows.length,
      0,
    );
    assert.equal(
      (await sql.query("select * from public.source_chunks")).rows.length,
      0,
    );
    assert.equal(
      (await sql.query("select * from public.lesson_versions")).rows.length,
      0,
    );
    await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id(1),
    ]);
    assert.equal(
      (await sql.query("select * from public.preparation_jobs")).rows.length,
      1,
    );
    await assert.rejects(
      sql.exec("update public.preparation_jobs set status='ready'"),
      /permission denied/,
    );
    await assert.rejects(
      sql.query("select public.claim_preparation($1,$2,0)", [
        teacher.id,
        job.id,
      ]),
      /permission denied/,
    );
    await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
      learner.id,
    ]);
    assert.equal(
      (await sql.query("select * from public.preparation_jobs")).rows.length,
      1,
    );
    assert.equal(
      (await sql.query("select * from public.source_documents")).rows.length,
      1,
    );
    await sql.exec("reset role;set role anon");
    await assert.rejects(
      sql.exec("select * from public.preparation_jobs"),
      /permission denied/,
    );
    await sql.exec(
      "reset role;update public.classes set active=false;set role service_role",
    );
    await assert.rejects(
      readPreparation(db, teacher, job.id),
      hasCode("preparation_forbidden"),
    );
  } finally {
    await sql.close();
  }
});

test("HTTP boundary with injected identity/database errors: auth before body, origin, bounded JSON and actionable missing migration", async () => {
  let called = false;
  const unauth = async () => {
    called = true;
    throw new IngestionError("unauthenticated", "Sign in.", 401);
  };
  const request = () =>
    new Request("http://localhost/api/preparations", {
      method: "POST",
      headers: { origin: "http://localhost", "idempotency-key": id(21) },
      body: "unread input",
    });
  const denied = request();
  assert.equal((await handleDurablePreparation(denied, unauth)).status, 401);
  assert.equal(denied.bodyUsed, false);
  assert.equal(called, true);
  called = false;
  const cross = request();
  cross.headers.set("origin", "https://other.invalid");
  assert.equal((await handleDurablePreparation(cross, unauth)).status, 403);
  assert.equal(called, false);
  const db = {
    rpc: async () => ({
      error: {
        message:
          "Could not find function check_preparation_owner in schema cache",
      },
      data: null,
    }),
  } as unknown as SupabaseClient;
  const access = async () => ({ db, actor: teacher });
  const unavailable = await handleDurablePreparation(request(), access);
  assert.equal(unavailable.status, 503);
  assert.equal(
    (await unavailable.json()).error_code,
    "preparation_storage_unavailable",
  );
  assert.equal(unavailable.headers.get("cache-control"), "no-store");
  const step = (body: string) =>
    new Request(`http://localhost/api/preparations/${id(31)}/step`, {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
      },
      body,
    });
  assert.equal(
    (await handleDurablePreparation(step("{"), access, id(31))).status,
    400,
  );
  const large = step("x".repeat(500001));
  large.headers.set("content-length", "1");
  assert.equal(
    (await handleDurablePreparation(large, access, id(31))).status,
    413,
  );
  assert.equal(
    (
      await handleDurablePreparation(
        new Request("http://localhost/api/preparations/bad"),
        access,
        "bad",
      )
    ).status,
    400,
  );
});
