import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("migrations, role isolation, private sessions, duplicate turns and immutable versions", async () => {
  const db = new PGlite();
  try {
    // SQL-level harness only. Supabase Auth/Storage services are NOT running.
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key, raw_user_meta_data jsonb not null default '{}');
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon, service_role;
      create schema storage;
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    `);
    for (const file of readdirSync("supabase/migrations")
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    }
    const id = (n: number) =>
      `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
    for (let n = 1; n <= 4; n++) {
      await db.query("insert into auth.users(id) values ($1)", [id(n)]);
      await db.query(
        "insert into public.profiles(auth_user_id, role, alias) values ($1, $2, $3)",
        [id(n), n <= 2 ? "teacher" : "learner", `Synthetic ${n}`],
      );
    }
    for (let n = 1; n <= 2; n++) {
      await db.query(
        "insert into public.classes(id, teacher_id, title, grade_band, join_code_hash) values ($1,$2,'Demo class','middle_school','synthetic-hash')",
        [id(10 + n), id(n)],
      );
      await db.query(
        "insert into public.memberships(class_id,student_id,alias_in_class) values ($1,$2,'Demo learner')",
        [id(10 + n), id(n + 2)],
      );
      await db.query(
        "insert into public.lessons(id,owner_id,class_id,title) values ($1,$2,$3,'Synthetic lesson')",
        [id(20 + n), id(n), id(10 + n)],
      );
      await db.query(
        `insert into public.lesson_versions(id,lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,reviewer_id,reviewed_at)
        values ($1,$2,1,'[{"id":"goal"}]','[{"id":"synthetic-reference"}]','{"synthetic":true}','Explain this example.','published',$3,now())`,
        [id(30 + n), id(20 + n), id(n)],
      );
      await db.query(
        "update public.lessons set current_published_version=$1 where id=$2",
        [id(30 + n), id(20 + n)],
      );
      await db.query(
        "insert into public.sessions(id,learner_id,class_id,lesson_version_id,visibility) values ($1,$2,$3,$4,'class')",
        [id(40 + n), id(n + 2), id(10 + n), id(30 + n)],
      );
    }
    // Role selection/user metadata cannot create an approved profile.
    await db.query(
      'insert into auth.users(id,raw_user_meta_data) values ($1, \'{"role":"teacher"}\')',
      [id(5)],
    );
    assert.equal(
      (
        await db.query("select * from public.profiles where auth_user_id=$1", [
          id(5),
        ])
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "update public.profiles set role='teacher' where auth_user_id=$1",
        [id(3)],
      ),
      /immutable/,
    );
    await assert.rejects(
      db.query(
        "insert into public.classes(teacher_id,title,grade_band,join_code_hash) values ($1,'Invalid','middle_school','hash')",
        [id(3)],
      ),
      /Teacher profile/,
    );
    await assert.rejects(
      db.query(
        "insert into public.memberships(class_id,student_id,alias_in_class) values ($1,$2,'Invalid')",
        [id(11), id(2)],
      ),
      /Learner profile/,
    );
    await assert.rejects(
      db.query(
        "update public.lesson_versions set initial_question='changed' where id=$1",
        [id(31)],
      ),
      /immutable/,
    );
    await assert.rejects(
      db.query(
        "insert into public.sessions(learner_id,class_id,lesson_version_id,visibility) values ($1,$2,$3,'class')",
        [id(3), id(11), id(32)],
      ),
      /Cross-class/,
    );
    await assert.rejects(
      db.query(
        "insert into public.sessions(learner_id,class_id,lesson_version_id,visibility) values ($1,$2,$3,'class')",
        [id(4), id(11), id(31)],
      ),
      /membership/,
    );
    await db.query(
      "insert into public.messages(session_id,sequence,role,text,turn_id) values ($1,1,'student','Synthetic answer',$2)",
      [id(41), id(51)],
    );
    await assert.rejects(
      db.query(
        "insert into public.messages(session_id,sequence,role,text,turn_id) values ($1,2,'student','Retry',$2)",
        [id(41), id(51)],
      ),
      /unique/,
    );
    // A separate learner-owned private lesson and session must stay invisible to teachers.
    await db.query(
      "insert into public.lessons(id,owner_id,title) values ($1,$2,'Private synthetic lesson')",
      [id(23), id(3)],
    );
    await db.query(
      `insert into public.lesson_versions(id,lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,reviewed_at)
      values ($1,$2,1,'[{"id":"goal"}]','[{"id":"synthetic-reference"}]','{}','Why?','published',now())`,
      [id(33), id(23)],
    );
    await db.query(
      "insert into public.sessions(id,learner_id,lesson_version_id,visibility) values ($1,$2,$3,'private')",
      [id(43), id(3), id(33)],
    );
    const become = async (n: number) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id(n),
      ]);
      await db.exec("set role authenticated");
    };
    await become(3);
    assert.equal(
      (await db.query("select id from public.sessions")).rows.length,
      2,
    );
    assert.equal(
      (await db.query("select id from public.lessons")).rows.length,
      2,
    );
    assert.equal(
      (await db.query("select id from public.classes")).rows.length,
      1,
    );
    await assert.rejects(
      db.query("select join_code_hash from public.classes"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("update public.profiles set role='teacher'"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("update public.sessions set status='completed'"),
      /permission denied/,
    );
    await become(4);
    assert.equal(
      (await db.query("select id from public.messages")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select id from public.sessions")).rows.length,
      1,
    );
    await become(1);
    assert.equal(
      (await db.query("select id from public.classes")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select id from public.sessions")).rows.length,
      0,
    );
    await become(2);
    assert.deepEqual((await db.query("select id from public.classes")).rows, [
      { id: id(12) },
    ]);
    assert.deepEqual((await db.query("select id from public.lessons")).rows, [
      { id: id(22) },
    ]);
    assert.equal(
      (await db.query("select id from public.sessions")).rows.length,
      0,
    );
    await become(5);
    assert.equal(
      (await db.query("select id from public.classes")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select public.reserve_sign_in_attempt($1)", ["a".repeat(64)]),
      /permission denied/,
    );
    await db.exec("reset role; set role anon");
    await assert.rejects(
      db.query("select * from public.profiles"),
      /permission denied/,
    );
    await db.exec("reset role");
    await db.query("update public.classes set active=false where id=$1", [
      id(11),
    ]);
    await become(3);
    assert.deepEqual((await db.query("select id from public.sessions")).rows, [
      { id: id(43) },
    ]);
    assert.equal(
      (await db.query("select id from public.messages")).rows.length,
      0,
    );
    await db.exec("reset role");
    await db.query("update public.classes set active=true where id=$1", [
      id(11),
    ]);
    await db.query(
      "update public.memberships set status='removed' where student_id=$1",
      [id(3)],
    );
    await become(3);
    assert.equal(
      (await db.query("select id from public.sessions")).rows.length,
      1,
    );
    await db.exec("reset role");
    await db.exec("set role service_role");
    for (let attempt = 1; attempt <= 6; attempt++) {
      assert.equal(
        (
          await db.query<{ allowed: boolean }>(
            "select public.reserve_sign_in_attempt($1) as allowed",
            ["a".repeat(64)],
          )
        ).rows[0].allowed,
        attempt <= 5,
      );
    }
    await assert.rejects(
      db.query("select public.reserve_sign_in_attempt('raw-email')"),
      /Invalid identifier/,
    );
    await db.exec(
      "update public.sign_in_attempts set attempts=100 where key='global'",
    );
    assert.equal(
      (
        await db.query<{ allowed: boolean }>(
          "select public.reserve_sign_in_attempt($1) as allowed",
          ["b".repeat(64)],
        )
      ).rows[0].allowed,
      false,
    );
    await db.exec(
      "update public.sign_in_attempts set window_start=window_start-interval '1 day'",
    );
    assert.equal(
      (
        await db.query<{ allowed: boolean }>(
          "select public.reserve_sign_in_attempt($1) as allowed",
          ["a".repeat(64)],
        )
      ).rows[0].allowed,
      true,
    );
    assert.equal(
      (await db.query("select * from public.sign_in_attempts")).rows.length,
      2,
    );
    await db.exec("reset role");
    const rls = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'",
    );
    assert.equal(rls.rows.length, 17);
    assert.ok(rls.rows.every((row) => row.relrowsecurity));
    assert.equal(
      (
        await db.query<{ public: boolean }>(
          "select public from storage.buckets",
        )
      ).rows[0].public,
      false,
    );
  } finally {
    await db.close();
  }
});
