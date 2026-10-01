import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { createClient } from "@supabase/supabase-js";
import { historyResponse, searchHistory } from "../src/lib/sessions/history";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("private history searches all title/message text, pages beyond twenty and rejects cross-owner access (SQL, not hosted Auth)", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('sub','user_' || replace(current_setting('request.jwt.claim.sub',true),'-',''),'iss','https://synthetic.clerk.accounts.dev','role','authenticated')$$;
      grant usage on schema auth,public to anon,authenticated,service_role;
      create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
    for (const file of readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    for (let n = 1; n <= 3; n++) {
      await db.query(
        "insert into public.profiles(auth_user_id,role,alias) values($1,$2,'Fictional')",
        [id(n), n === 3 ? "teacher" : "learner"],
      );
      await db.query(
        "insert into public.clerk_identities(user_id,clerk_user_id,issuer) values($1,$2,'https://synthetic.clerk.accounts.dev')",
        [id(n), `user_${id(n).replaceAll("-", "")}`],
      );
    }
    for (let n = 1; n <= 2; n++) {
      await db.query(
        "insert into public.lessons(id,owner_id,title) values($1,$2,'Fictional lesson')",
        [id(10 + n), id(n)],
      );
      await db.query(
        `insert into public.lesson_versions(id,lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status) values($1,$2,1,'[{"id":"goal"}]','[]','{}','Why?','private_ready')`,
        [id(20 + n), id(10 + n)],
      );
      for (let item = 1; item <= (n === 1 ? 25 : 1); item++) {
        await db.query(
          "insert into public.sessions(id,learner_id,lesson_version_id,visibility,opened_at) values($1,$2,$3,'private','2026-10-01T00:00:00Z')",
          [id(n * 100 + item), id(n), id(20 + n)],
        );
        await db.query(
          "insert into public.messages(session_id,sequence,role,text,turn_id) values($1,0,'student',$2,$3)",
          [
            id(n * 100 + item),
            item === 1
              ? "Fictional hidden older message 100%_literal*"
              : "Fictional ordinary explanation",
            id(n * 1000 + item),
          ],
        );
      }
    }
    await db.query(
      "insert into public.classes(id,teacher_id,title,grade_band,join_code_hash) values($1,$2,'Fictional class','middle_school','hash')",
      [id(30), id(3)],
    );
    await db.query(
      "insert into public.memberships(class_id,student_id,alias_in_class) values($1,$2,'Fictional')",
      [id(30), id(1)],
    );
    await db.query(
      "insert into public.lessons(id,owner_id,class_id,title) values($1,$2,$3,'Fictional class lesson')",
      [id(31), id(3), id(30)],
    );
    await db.query(
      `insert into public.lesson_versions(id,lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,reviewed_at) values($1,$2,1,'[{"id":"goal"}]','[{"id":"ref"}]','{}','Why?','published',now())`,
      [id(32), id(31)],
    );
    await db.query(
      "insert into public.sessions(id,learner_id,lesson_version_id,class_id,visibility) values($1,$2,$3,$4,'class')",
      [id(33), id(1), id(32), id(30)],
    );
    const become = async (n: number) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        id(n),
      ]);
      await db.exec("set role authenticated");
    };
    const search = (owner: number, query = "", offset = 0) =>
      db.query<{ id: string }>(
        "select * from public.search_private_history($1,$2,$3)",
        [id(owner), query, offset],
      );
    await become(1);
    assert.equal((await search(1)).rows.length, 21);
    assert.equal((await search(1)).rows[0].id, id(125));
    assert.equal((await search(1, "", 20)).rows.length, 5);
    assert.equal((await search(1, "HIDDEN OLDER")).rows[0].id, id(101));
    assert.equal((await search(1, "100%_literal*")).rows.length, 1);
    assert.equal((await search(1, "100XXliteralZZ")).rows.length, 0);
    assert.equal((await search(1, "class lesson")).rows.length, 0);
    await assert.rejects(search(2), /history_access_denied/);
    await assert.rejects(search(1, "x".repeat(121)), /invalid_history_query/);
    await assert.rejects(search(1, "", -1), /invalid_history_query/);
    await become(2);
    assert.equal((await search(2, "hidden older")).rows[0].id, id(201));
    await become(3);
    assert.equal((await search(3)).rows.length, 0);
    await db.exec("reset role; set role anon");
    await assert.rejects(search(1), /permission denied/);
  } finally {
    await db.close();
  }
});

test("history endpoint validates requests, retains owner RLS client, pages and never caches private results", async () => {
  let calls = 0;
  let fail = false;
  const db = createClient("https://synthetic.supabase.co", "fictional-key", {
    global: {
      fetch: async (_url, options) => {
        calls++;
        const body = JSON.parse(String(options?.body));
        assert.equal(body.p_owner, id(1));
        assert.equal(body.p_query, "hidden older");
        assert.equal(body.p_offset, 20);
        return new Response(
          JSON.stringify(
            fail
              ? { message: "Private SQL detail" }
              : Array.from({ length: 21 }, (_, n) => ({
                  id: id(n + 100),
                  title: "Fictional",
                  opened_at: "2026-10-01T00:00:00Z",
                })),
          ),
          {
            status: fail ? 500 : 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  });
  const identify = async () => ({ db, user: { id: id(1) } });
  const request = (query: string) =>
    new Request(`https://errby.test/api/sessions/search?${query}`);
  const denied = await historyResponse(request(""), async () => null);
  assert.equal(denied.status, 401);
  for (const query of [
    "offset=-1",
    "offset=1.5",
    "offset=999999999999999",
    `q=${"x".repeat(121)}`,
  ])
    assert.equal((await historyResponse(request(query), identify)).status, 400);
  assert.equal(calls, 0);
  const response = await historyResponse(
    request("q=hidden+older&offset=20"),
    identify,
  );
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const result = await response.json();
  assert.equal(result.items.length, 20);
  assert.equal(result.nextOffset, 40);
  assert.equal(result.items[0].title, "Fictional");
  fail = true;
  const error = await historyResponse(
    request("q=hidden+older&offset=20"),
    identify,
  );
  assert.equal(error.status, 503);
  assert.doesNotMatch(await error.text(), /SQL/);
  await assert.rejects(searchHistory(db, "not-an-owner"));
});
