import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("teacher review is append-only, current-version bound and class owned", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
    );
    for (const file of readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    const id = (n: number) =>
      `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
    for (const [n, role] of [
      [1, "teacher"],
      [2, "teacher"],
      [3, "learner"],
    ] as const) {
      await db.query("insert into auth.users values($1)", [id(n)]);
      await db.query(
        "insert into public.profiles(auth_user_id,role,alias) values($1,$2,'Synthetic')",
        [id(n), role],
      );
    }
    await db.query(
      "insert into public.classes(id,teacher_id,title,grade_band,join_code_hash) values($1,$2,'Synthetic class','middle_school',$3)",
      [id(4), id(1), "x".repeat(64)],
    );
    await db.query(
      "insert into public.source_documents(id,owner_id,class_id,kind) values($1,$2,$3,'text')",
      [id(5), id(1), id(4)],
    );
    await db.query(
      "insert into public.lessons(id,owner_id,class_id,title) values($1,$2,$3,'Synthetic lesson')",
      [id(6), id(1), id(4)],
    );
    const draft = {
      id: "synthetic",
      version: 1,
      title: "Synthetic lesson",
      initial_question: "What is this?",
      teacher_review: { status: "pending" },
      objectives: [{ id: "goal" }],
      references: [{ id: "ref" }],
    };
    await db.query(
      "insert into public.lesson_versions(id,lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,lesson_json,content_hash) values($1,$2,1,$3,$4,'{}','What is this?','needs_review',$5,$6)",
      [
        id(7),
        id(6),
        JSON.stringify(draft.objectives),
        JSON.stringify(draft.references),
        JSON.stringify(draft),
        "a".repeat(64),
      ],
    );
    await db.query(
      "insert into public.preparation_jobs(id,owner_id,class_id,source_id,input_hash,current_step,status,partial_results) values($1,$2,$3,$4,$5,2,'needs_review',$6)",
      [
        id(8),
        id(1),
        id(4),
        id(5),
        "a".repeat(64),
        JSON.stringify({ lesson_id: id(6), lesson_version_id: id(7) }),
      ],
    );
    const run = async (
      actor: string,
      expected: string,
      action: string,
      lesson: unknown = null,
    ) =>
      db.query<{ advance_lesson_review: string }>(
        "select public.advance_lesson_review($1,$2,$3,$4,$5)",
        [actor, id(8), expected, action, lesson && JSON.stringify(lesson)],
      );
    await assert.rejects(run(id(2), id(7), "review"), /stale_lesson/);
    await assert.rejects(run(id(3), id(7), "review"), /stale_lesson/);
    await assert.rejects(run(id(1), id(7), "publish"), /review_unavailable/);
    const editedDraft = {
      ...draft,
      version: 2,
      title: "Edited synthetic lesson",
    };
    const edited = (await run(id(1), id(7), "edit", editedDraft)).rows[0]
      .advance_lesson_review;
    await assert.rejects(run(id(1), id(7), "review"), /stale_lesson/);
    const approved = (await run(id(1), edited, "review")).rows[0]
      .advance_lesson_review;
    await assert.rejects(run(id(1), id(7), "publish"), /stale_lesson/);
    const published = (await run(id(1), approved, "publish")).rows[0]
      .advance_lesson_review;
    assert.equal(
      (
        await db.query<{ current_published_version: string }>(
          "select current_published_version from public.lessons where id=$1",
          [id(6)],
        )
      ).rows[0].current_published_version,
      published,
    );
    await assert.rejects(
      db.query(
        "update public.lesson_versions set initial_question='changed' where id=$1",
        [published],
      ),
      /immutable/i,
    );
    const rows = await db.query<{ version: number; review_status: string }>(
      "select version,review_status from public.lesson_versions where lesson_id=$1 order by version",
      [id(6)],
    );
    assert.deepEqual(
      rows.rows.map((row) => row.review_status),
      ["needs_review", "needs_review", "approved", "published"],
    );
    await db.query(
      "insert into public.memberships(class_id,student_id,alias_in_class,status) values($1,$2,'Synthetic learner','active')",
      [id(4), id(3)],
    );
    await db.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','${id(3)}',false);`,
    );
    assert.equal(
      (await db.query("select * from public.lessons")).rows.length,
      1,
    );
    await assert.rejects(
      run(id(1), published, "edit", { ...editedDraft, version: 5 }),
      /permission denied/,
    );
    await db.exec("reset role");
    await db.query(
      "update public.memberships set status='removed' where student_id=$1",
      [id(3)],
    );
    await db.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','${id(3)}',false);`,
    );
    assert.equal(
      (await db.query("select * from public.lessons")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
