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
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('sub','user_' || replace(current_setting('request.jwt.claim.sub',true),'-',''),'iss','https://synthetic.clerk.accounts.dev','role','authenticated')$$;
      grant usage on schema auth, public to authenticated, anon, service_role;
      create schema storage; create table storage.buckets(id text primary key, name text, public boolean,
        file_size_limit bigint, allowed_mime_types text[]);`);
    for (const name of readdirSync("supabase/migrations")
      .filter((n) => n.endsWith(".sql"))
      .sort())
      await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));

    // Test fixture mapping only; actual provisioning is covered separately.
    await db.exec(`create function public.test_clerk_mapping() returns trigger language plpgsql as $$begin
      insert into public.clerk_identities(user_id,clerk_user_id,issuer) values(new.auth_user_id,'user_' || replace(new.auth_user_id::text,'-',''),'https://synthetic.clerk.accounts.dev'); return new; end;$$;
      create trigger test_clerk_mapping after insert on public.profiles for each row execute function public.test_clerk_mapping();`);
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
    await assert.rejects(
      db.query("select public.reserve_model_cost($1,$2,'evaluation',0.031)", [
        key,
        owner,
      ]),
      /model_call_limit/,
    );
    // Larger synthetic values make the existing cap boundary assertions readable.
    await db.exec("update public.model_budget set max_call_usd = 1");
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
    const claim = async (requestKey: string) =>
      (
        await db.query<{ claimed: boolean }>(
          "select public.claim_model_request($1) as claimed",
          [requestKey],
        )
      ).rows[0].claimed;
    assert.deepEqual(await Promise.all([claim(key2), claim(key2)]), [
      true,
      false,
    ]);
    await assert.rejects(
      db.query("select public.settle_model_cost($1,'released',0,0)", [key2]),
      /release_requires_undispatched_request/,
    );
    await db.exec("update public.model_budget set enabled = false");
    await assert.rejects(claim(key3), /model_budget_disabled/);
    await db.exec("update public.model_budget set enabled = true");
    await db.query(
      "update public.usage_ledger set lease_until = now() - interval '1 minute' where request_key = $1",
      [key3],
    );
    assert.equal(await claim(key3), false);
    await assert.rejects(
      db.query("select public.reserve_model_cost($1,$2,'errby',0.01)", [
        key4,
        owner,
      ]),
      /model_concurrency_limit/,
    );
    await db.query(
      `select public.settle_model_cost($1,'succeeded',10,0.4,'synthetic-model','synthetic-request','{"result":"synthetic"}')`,
      [key2],
    );
    assert.equal(await claim(key2), false);
    await db.query("select public.settle_model_cost($1,'succeeded',10,0.4)", [
      key2,
    ]);
    await assert.rejects(
      db.query(
        "select public.settle_model_cost($1,'succeeded',10,0.4,'different-model')",
        [key2],
      ),
      /settlement_conflict/,
    );
    await assert.rejects(
      db.query(
        `select public.settle_model_cost($1,'succeeded',10,0.4,null,null,'{"result":"changed"}')`,
        [key2],
      ),
      /settlement_conflict/,
    );
    assert.deepEqual(
      (
        await db.query(
          "select model_id, provider_request_id from public.usage_ledger where request_key = $1",
          [key2],
        )
      ).rows[0],
      { model_id: "synthetic-model", provider_request_id: "synthetic-request" },
    );
    assert.deepEqual(
      (
        await db.query<{ response_json: unknown }>(
          "select response_json from public.usage_ledger where request_key=$1",
          [key2],
        )
      ).rows[0],
      { response_json: { result: "synthetic" } },
    );
    await db.query(
      "update public.usage_ledger set created_at = now() - interval '31 days' where request_key=$1",
      [key2],
    );
    await db.query("select public.expire_learner_records()");
    assert.equal(
      (
        await db.query<{ response_json: unknown }>(
          "select response_json from public.usage_ledger where request_key=$1",
          [key2],
        )
      ).rows[0].response_json,
      null,
    );
    await db.query(
      `update public.usage_ledger set response_json = '{"result":"synthetic"}' where request_key=$1`,
      [key],
    );
    await db.query("delete from public.profiles where auth_user_id=$1", [
      owner,
    ]);
    assert.equal(
      (
        await db.query<{ response_json: unknown }>(
          "select response_json from public.usage_ledger where request_key=$1",
          [key],
        )
      ).rows[0].response_json,
      null,
    );
    await assert.rejects(
      db.query("select public.reserve_model_cost($1,$2,'errby',0.11)", [
        key4,
        owner,
      ]),
      /model_budget_exhausted/,
    );
    await db.exec("set role authenticated");
    await assert.rejects(claim(key3), /permission denied/);
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
