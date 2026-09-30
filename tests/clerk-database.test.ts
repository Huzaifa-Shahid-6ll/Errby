import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("Clerk SQL mapping: preserved UUIDs, isolation, idempotency, approval and deletion (not live Auth)", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      grant usage on schema auth,public to anon,authenticated,service_role;
      create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
    for (const file of readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    const issuer = "https://synthetic.clerk.accounts.dev";
    const oldId = "00000000-0000-4000-8000-000000000001";
    await db.query("insert into auth.users values($1)", [oldId]);
    await db.query(
      "insert into public.profiles(auth_user_id,role,alias) values($1,'teacher','Original alias')",
      [oldId],
    );
    await db.exec("set role service_role");
    const provision = async (
      subject: string,
      role: string,
      existing: string | null = null,
    ) =>
      (
        await db.query<{ id: string }>(
          "select public.provision_clerk_identity($1,$2,$3,'Synthetic','middle_school',$4) id",
          [subject, issuer, role, existing],
        )
      ).rows[0].id;
    assert.equal(await provision("user_teacher", "teacher", oldId), oldId);
    assert.equal(await provision("user_teacher", "teacher", oldId), oldId);
    const [learner, replay] = await Promise.all([
      provision("user_learner", "learner"),
      provision("user_learner", "learner"),
    ]);
    assert.equal(learner, replay);
    assert.equal(
      (await db.query("select * from public.profiles")).rows.length,
      2,
    );
    await assert.rejects(
      provision("user_teacher", "learner", oldId),
      /identity_conflict/,
    );
    await assert.rejects(provision("user_other", "teacher", oldId), /unique/);
    const become = async (sub: string, iss = issuer, extra = {}) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claims',$1,false)", [
        JSON.stringify({ sub, iss, role: "authenticated", ...extra }),
      ]);
      await db.exec("set role authenticated");
    };
    await become("user_learner");
    assert.deepEqual(
      (await db.query("select auth_user_id from public.profiles")).rows,
      [{ auth_user_id: learner }],
    );
    await assert.rejects(
      db.query("select * from public.clerk_identities"),
      /permission denied/,
    );
    await assert.rejects(
      provision("user_intruder", "teacher"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("update public.profiles set role='teacher'"),
      /permission denied/,
    );
    for (const [sub, iss, extra] of [
      [oldId, issuer, {}],
      ["user_teacher", "https://wrong.clerk.accounts.dev", {}],
      ["user_unknown", issuer, {}],
      ["user_teacher", issuer, { sts: "pending" }],
    ] as const) {
      await become(sub, iss, extra);
      assert.equal(
        (await db.query("select * from public.profiles")).rows.length,
        0,
      );
    }
    await db.exec("reset role; set role service_role");
    const classroom = (
      await db.query<{ id: string }>(
        "insert into public.classes(teacher_id,title,grade_band,join_code_hash) values($1,'Synthetic','middle_school','test') returning id",
        [oldId],
      )
    ).rows[0].id;
    await assert.rejects(
      db.query(
        "select public.begin_clerk_account_deletion('user_teacher',$1)",
        [issuer],
      ),
      /classes_remain/,
    );
    await db.query(
      "select public.begin_clerk_account_deletion('user_learner',$1)",
      [issuer],
    );
    await become("user_learner");
    assert.equal(
      (await db.query("select * from public.profiles")).rows.length,
      0,
    );
    await db.exec("reset role; set role service_role");
    await assert.rejects(
      provision("user_learner", "learner"),
      /identity_conflict/,
    );
    assert.equal(
      (
        await db.query<{ user_id: string }>(
          "select user_id from public.clerk_identities where deletion_requested_at is not null",
        )
      ).rows.length,
      1,
    );
    await db.query("delete from public.profiles where auth_user_id=$1", [
      learner,
    ]);
    assert.equal(
      (await db.query("select * from public.clerk_identities")).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query<{ alias: string }>(
          "select alias from public.profiles where auth_user_id=$1",
          [oldId],
        )
      ).rows[0].alias,
      "Original alias",
    );
    assert.equal(
      (await db.query("select id from public.classes where id=$1", [classroom]))
        .rows.length,
      1,
    );
    await db.exec("reset role");
    assert.equal(
      (
        await db.query(
          "select policyname from pg_policies where schemaname='public' and qual like '%auth.uid()%'",
        )
      ).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
