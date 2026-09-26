import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("model reservations fail closed, settle idempotently, and stay private", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key, raw_user_meta_data jsonb not null default '{}');
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon, service_role;
      create schema storage; create table storage.buckets(id text primary key, name text, public boolean,
        file_size_limit bigint, allowed_mime_types text[]);`);
    for (const name of readdirSync("supabase/migrations")
      .filter((n) => n.endsWith(".sql"))
      .sort())
      await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));
    const owner = "00000000-0000-0000-0000-000000000001";
    const key = "00000000-0000-0000-0000-000000000002";
    await db.query("insert into auth.users(id) values ($1)", [owner]);
    await db.query(
      "insert into public.profiles(auth_user_id,role,alias) values ($1,'learner','Synthetic')",
      [owner],
    );
    await assert.rejects(
      db.query("select public.reserve_model_cost($1,$2,'evaluation',0.1)", [
        key,
        owner,
      ]),
      /model_budget_disabled/,
    );
    await db.exec(
      "insert into public.model_budget(cap_usd,enabled) values (1,true)",
    );
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select public.reserve_model_cost($1,$2,'evaluation',0.1) as status",
          [key, owner],
        )
      ).rows[0].status,
      "reserved",
    );
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select public.reserve_model_cost($1,$2,'evaluation',0.1) as status",
          [key, owner],
        )
      ).rows[0].status,
      "reserved",
    );
    await assert.rejects(
      db.query("select public.reserve_model_cost($1,$2,'errby',0.1)", [
        key,
        owner,
      ]),
      /reservation_conflict/,
    );
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select public.settle_model_cost($1,'failed',0,0) as status",
          [key],
        )
      ).rows[0].status,
      "failed",
    );
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select public.settle_model_cost($1,'failed',0,0) as status",
          [key],
        )
      ).rows[0].status,
      "failed",
    );
    await assert.rejects(
      db.query("select public.settle_model_cost($1,'succeeded',1,0.1)", [key]),
      /settlement_conflict/,
    );
    const key2 = "00000000-0000-0000-0000-000000000003";
    const key3 = "00000000-0000-0000-0000-000000000004";
    const key4 = "00000000-0000-0000-0000-000000000005";
    await db.query("select public.reserve_model_cost($1,$2,'evaluation',0.4)", [
      key2,
      owner,
    ]);
    await db.query("select public.reserve_model_cost($1,$2,'errby',0.4)", [
      key3,
      owner,
    ]);
    await assert.rejects(
      db.query("select public.reserve_model_cost($1,$2,'errby',0.01)", [
        key4,
        owner,
      ]),
      /model_concurrency_limit/,
    );
    await db.query("select public.settle_model_cost($1,'succeeded',10,0.4)", [
      key2,
    ]);
    await assert.rejects(
      db.query("select public.reserve_model_cost($1,$2,'errby',0.11)", [
        key4,
        owner,
      ]),
      /model_budget_exhausted/,
    );
    await db.exec("set role authenticated");
    await assert.rejects(
      db.query("select public.reserve_model_cost($1,$2,'evaluation',0.1)", [
        key,
        owner,
      ]),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select * from public.model_budget"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
