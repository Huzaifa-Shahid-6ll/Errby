import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("class creation, rotation, joining and role limits", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('sub','user_' || replace(current_setting('request.jwt.claim.sub',true),'-',''),'iss','https://synthetic.clerk.accounts.dev','role','authenticated')$$;
      grant usage on schema auth, public to authenticated, anon, service_role;
      create schema storage; create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`);
    for (const file of readdirSync("supabase/migrations")
      .filter((name) => name.endsWith(".sql"))
      .sort())
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));

    // Test fixture mapping only; actual provisioning is covered separately.
    await db.exec(`create function public.test_clerk_mapping() returns trigger language plpgsql as $$begin
      insert into public.clerk_identities(user_id,clerk_user_id,issuer) values(new.auth_user_id,'user_' || replace(new.auth_user_id::text,'-',''),'https://synthetic.clerk.accounts.dev'); return new; end;$$;
      create trigger test_clerk_mapping after insert on public.profiles for each row execute function public.test_clerk_mapping();`);
    const teacher = "00000000-0000-4000-8000-000000000001";
    const learner = "00000000-0000-4000-8000-000000000002";
    const other = "00000000-0000-4000-8000-000000000003";
    for (const [id, role] of [
      [teacher, "teacher"],
      [learner, "learner"],
      [other, "teacher"],
    ]) {
      await db.query("insert into auth.users values($1)", [id]);
      await db.query(
        "insert into public.profiles(auth_user_id,role,alias) values($1,$2,'Synthetic')",
        [id, role],
      );
    }
    const first = "a".repeat(64),
      second = "b".repeat(64);
    const created = await db.query<{ create_class: string }>(
      "select public.create_class($1,'Science','middle_school',$2)",
      [teacher, first],
    );
    const classId = created.rows[0].create_class;
    await assert.rejects(
      db.query("select public.create_class($1,'Bad','middle_school',$2)", [
        learner,
        second,
      ]),
      /teacher_required/,
    );
    assert.equal(
      (
        await db.query<{ rotate_class_code: boolean }>(
          "select public.rotate_class_code($1,$2,$3)",
          [other, classId, second],
        )
      ).rows[0].rotate_class_code,
      false,
    );
    assert.equal(
      (
        await db.query<{ join_class: { error: string } }>(
          "select public.join_class($1,$2,false)",
          [learner, second],
        )
      ).rows[0].join_class.error,
      "invalid_code",
    );
    const preview = await db.query<{ join_class: { title: string } }>(
      "select public.join_class($1,$2,false)",
      [learner, first],
    );
    assert.equal(preview.rows[0].join_class.title, "Science");
    assert.equal(
      (await db.query("select * from public.memberships")).rows.length,
      0,
    );
    await db.query("select public.join_class($1,$2,true)", [learner, first]);
    await db.query("select public.join_class($1,$2,true)", [learner, first]);
    assert.equal(
      (await db.query("select * from public.memberships")).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query<{ rotate_class_code: boolean }>(
          "select public.rotate_class_code($1,$2,$3)",
          [teacher, classId, second],
        )
      ).rows[0].rotate_class_code,
      true,
    );
    assert.equal(
      (
        await db.query<{ join_class: { error: string } }>(
          "select public.join_class($1,$2,true)",
          [learner, first],
        )
      ).rows[0].join_class.error,
      "invalid_code",
    );
    assert.equal(
      (await db.query("select * from public.memberships where status='active'"))
        .rows.length,
      1,
    );
    await assert.rejects(
      db.query("select public.join_class($1,$2,true)", [teacher, second]),
      /learner_required/,
    );
    for (let i = 0; i < 6; i++)
      await db.query("select public.join_class($1,$2,false)", [
        learner,
        second,
      ]);
    assert.equal(
      (
        await db.query<{ join_class: { error: string } }>(
          "select public.join_class($1,$2,false)",
          [learner, second],
        )
      ).rows[0].join_class.error,
      "rate_limited",
    );
    await assert.rejects(
      db.exec(
        "set role authenticated; select public.create_class('00000000-0000-4000-8000-000000000001','Bad','middle_school','cccc');",
      ),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
