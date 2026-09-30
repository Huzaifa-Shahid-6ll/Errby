import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IngestionError } from "../src/lib/ingestion/server";
import {
  getSession,
  listPublishedLessons,
  openSession,
  submitTurn,
  type SessionActor,
} from "../src/lib/sessions/service";
import { handleSessionApi } from "../src/lib/sessions/request";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config as proxyConfig } from "../src/proxy";

test("Clerk proxy covers app, API and auth routes", () => {
  for (const url of [
    "/classes",
    "/classes/example",
    "/api/classes",
    "/api/classes/example/results",
    "/api/account",
    "/learn",
    "/api/sessions/example",
    "/sign-in",
    "/sign-up",
    "/account",
    "/prepare/extract",
    "/api/health",
  ])
    assert.equal(
      unstable_doesMiddlewareMatch({
        config: proxyConfig,
        nextConfig: {},
        url,
      }),
      true,
      url,
    );
  assert.equal(
    unstable_doesMiddlewareMatch({
      config: proxyConfig,
      nextConfig: {},
      url: "/_next/static/test.js",
    }),
    false,
  );
});

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const teacherOne: SessionActor = { id: id(1), role: "teacher" };
const teacherTwo: SessionActor = { id: id(2), role: "teacher" };
const learnerThree: SessionActor = { id: id(3), role: "learner" };
const learnerFour: SessionActor = { id: id(4), role: "learner" };
const hasCode = (code: string) => (error: unknown) =>
  error instanceof IngestionError && error.code === code;
const INITIAL_QUESTION =
  "How does warmth move along a metal spoon sitting in hot soup?";

test("PGlite only: session open binds the published opening question, enforces scope/membership and gives one accepted turn per key", async () => {
  const sql = new PGlite();
  try {
    await sql.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('sub','user_' || replace(current_setting('request.jwt.claim.sub',true),'-',''),'iss','https://synthetic.clerk.accounts.dev','role','authenticated')$$;grant usage on schema auth,public to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
    );
    for (const file of readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await sql.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    // Test fixture mapping only; actual provisioning is covered separately.
    await sql.exec(`create function public.test_clerk_mapping() returns trigger language plpgsql as $$begin
      insert into public.clerk_identities(user_id,clerk_user_id,issuer) values(new.auth_user_id,'user_' || replace(new.auth_user_id::text,'-',''),'https://synthetic.clerk.accounts.dev'); return new; end;$$;
      create trigger test_clerk_mapping after insert on public.profiles for each row execute function public.test_clerk_mapping();`);

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
    await sql.query(
      "insert into public.memberships(class_id,student_id,alias_in_class) values($1,$2,'Synthetic learner')",
      [id(11), id(3)],
    );
    // lesson 50/class 11: current published version 51 and an unreviewed 52.
    // lesson 60: published but archived. lesson 70: private, learner-owned.
    // lesson 80/class 12: another teacher's published lesson.
    const lessons: [number, number, string | null, number, string][] = [
      [50, 1, id(11), 51, "Fictional heat transfer"],
      [60, 1, id(11), 61, "Fictional archived lesson"],
      [70, 3, null, 71, "Fictional private lesson"],
      [80, 2, id(12), 81, "Fictional other class lesson"],
    ];
    for (const [lessonId, owner, classId, , title] of lessons)
      await sql.query(
        "insert into public.lessons(id,owner_id,class_id,title) values($1,$2,$3,$4)",
        [id(lessonId), id(owner), classId, title],
      );
    const versions: [number, number, number, string][] = [
      [51, 50, 1, "published"],
      [52, 50, 2, "needs_review"],
      [61, 60, 1, "published"],
      [71, 70, 1, "published"],
      [81, 80, 1, "published"],
    ];
    for (const [versionId, lessonId, version, status] of versions)
      await sql.query(
        `insert into public.lesson_versions(id,lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,reviewed_at)
         values($1,$2,$6,$3,'[{"id":"ref"}]'::jsonb,'{}'::jsonb,$4,$5,case when $5='published' then now() else null end)`,
        [
          id(versionId),
          id(lessonId),
          JSON.stringify([{ id: "o1", title: "Explain heat flow" }]),
          INITIAL_QUESTION,
          status,
          version,
        ],
      );
    for (const [lessonId, , , versionId] of lessons)
      await sql.query(
        "update public.lessons set current_published_version=$2 where id=$1",
        [id(lessonId), id(versionId)],
      );
    await sql.query("update public.lessons set archived_at=now() where id=$1", [
      id(60),
    ]);

    // This adapter executes actual SQL via PGlite. It is NOT Supabase HTTP/Auth/JWT verification.
    const functions: Record<string, string[]> = {
      assert_learning_session_access: ["p_learner", "p_session_id"],
      set_learning_session_paused: ["p_learner", "p_session_id", "p_pause"],
      open_learning_session: ["p_learner", "p_lesson_version_id"],
      record_student_turn: [
        "p_learner",
        "p_session_id",
        "p_turn_id",
        "p_text",
        "p_expected_sequence",
      ],
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
        assert.ok(
          [
            "sessions",
            "messages",
            "lesson_versions",
            "lessons",
            "objective_progress",
          ].includes(table),
        );
        const values: unknown[] = [];
        const filters: string[] = [];
        let orderClause = "";
        let limitClause = "";
        let embedLessons = false;
        const query = {
          select(columns: string) {
            embedLessons = columns.includes(
              "lessons!lesson_versions_lesson_id_fkey!inner",
            );
            return query;
          },
          eq(column: string, value: unknown) {
            assert.match(column, /^[a-z_]+$/);
            values.push(value);
            filters.push(`${column}=$${values.length}`);
            return query;
          },
          in(column: string, list: unknown[]) {
            values.push(list);
            filters.push(`${column}=any($${values.length}::uuid[])`);
            return query;
          },
          order(column: string, { ascending }: { ascending: boolean }) {
            orderClause = ` order by ${column} ${ascending ? "asc" : "desc"}`;
            return query;
          },
          limit(count: number) {
            limitClause = ` limit ${count}`;
            return query;
          },
          async maybeSingle() {
            const where = filters.length
              ? ` where ${filters.join(" and ")}`
              : "";
            let text: string;
            if (table === "lesson_versions" && embedLessons)
              text = `select to_jsonb(v) as value from (select v.objectives_json, jsonb_build_object('title', l.title) as lessons from public.lesson_versions v join public.lessons l on l.id=v.lesson_id${where.replace(/id=/, "v.id=")}) v${limitClause}`;
            else
              text = `select to_jsonb(t) as value from (select * from public.${table}${where}) t${orderClause}${limitClause}`;
            const data = await sql.query<{ value: unknown }>(text, values);
            return { data: data.rows[0]?.value ?? null, error: null };
          },
          then(
            resolve: (value: unknown) => void,
            reject: (reason?: unknown) => void,
          ) {
            const where = filters.length
              ? ` where ${filters.join(" and ")}`
              : "";
            sql
              .query<{ value: unknown }>(
                `select to_jsonb(t) as value from (select * from public.${table}${where}) t${orderClause}${limitClause}`,
                values,
              )
              .then(
                (data) =>
                  resolve({
                    data: data.rows.map((row) => row.value),
                    error: null,
                  }),
                reject,
              );
          },
        };
        return query;
      },
    } as unknown as SupabaseClient;

    await sql.exec("set role service_role");
    const opened = await openSession(db, learnerThree, {
      lesson_version_id: id(51),
    });
    assert.equal(opened.session.status, "awaiting_student");
    assert.equal(opened.session.visibility, "class");
    assert.equal(opened.session.lesson_title, "Fictional heat transfer");
    assert.deepEqual(opened.session.objective_labels, ["Explain heat flow"]);
    assert.equal(opened.messages.length, 1);
    assert.equal(opened.messages[0].role, "errby");
    assert.equal(opened.messages[0].sequence, 0);
    assert.equal(opened.messages[0].text, INITIAL_QUESTION);
    const sessionId = opened.session.id;
    assert.equal(
      (
        await sql.query<{ text: string }>(
          "select text from public.messages where session_id=$1 and sequence=0",
          [sessionId],
        )
      ).rows[0].text,
      INITIAL_QUESTION,
      "the opening question must be the published version's own text",
    );
    await assert.rejects(
      openSession(db, teacherOne, { lesson_version_id: id(51) }),
      hasCode("session_learner_required"),
    );
    await assert.rejects(
      openSession(db, learnerFour, { lesson_version_id: id(51) }),
      hasCode("membership_required"),
    );
    await assert.rejects(
      openSession(db, learnerThree, { lesson_version_id: id(52) }),
      hasCode("lesson_unavailable"),
    );
    await assert.rejects(
      openSession(db, learnerThree, { lesson_version_id: id(61) }),
      hasCode("lesson_unavailable"),
    );
    await assert.rejects(
      openSession(db, learnerThree, { lesson_version_id: id(81) }),
      hasCode("membership_required"),
    );
    await assert.rejects(
      openSession(db, learnerThree, {
        lesson_version_id: id(51),
        text: "fabricated opening",
      } as never),
      hasCode("invalid_request"),
    );
    const privateOpened = await openSession(db, learnerThree, {
      lesson_version_id: id(71),
    });
    assert.equal(privateOpened.session.visibility, "private");
    await assert.rejects(
      openSession(db, learnerFour, { lesson_version_id: id(71) }),
      hasCode("private_lesson_denied"),
    );

    const answer =
      "The warm soup heats the spoon end, and the heat travels along the metal to the cooler end.";
    const turn = await submitTurn(db, learnerThree, sessionId, {
      text: answer,
      expected_sequence: 0,
      idempotency_key: id(100),
    });
    assert.equal(turn.message.sequence, 1);
    assert.equal(turn.message.role, "student");
    assert.equal(turn.message.text, answer);
    assert.equal(turn.session.status, "evaluating");
    assert.equal(turn.session.last_sequence, 1);
    const replay = await submitTurn(db, learnerThree, sessionId, {
      text: answer,
      expected_sequence: 1,
      idempotency_key: id(100),
    });
    assert.equal(replay.message.id, turn.message.id);
    assert.equal(
      (await sql.query("select * from public.messages")).rows.length,
      3,
      "replay must not duplicate the stored answer",
    );
    await assert.rejects(
      submitTurn(db, learnerThree, sessionId, {
        text: "different text on the same key",
        expected_sequence: 1,
        idempotency_key: id(100),
      }),
      hasCode("turn_conflict"),
    );
    await assert.rejects(
      submitTurn(db, learnerThree, sessionId, {
        text: answer,
        expected_sequence: 0,
        idempotency_key: id(101),
      }),
      hasCode("sequence_conflict"),
    );
    await assert.rejects(
      submitTurn(db, learnerThree, sessionId, {
        text: answer,
        expected_sequence: 1,
        idempotency_key: id(102),
      }),
      hasCode("session_not_awaiting"),
    );
    await assert.rejects(
      submitTurn(db, learnerFour, sessionId, {
        text: answer,
        expected_sequence: 1,
        idempotency_key: id(103),
      }),
      hasCode("session_forbidden"),
    );
    await assert.rejects(
      submitTurn(db, learnerThree, sessionId, {
        text: "x".repeat(2001),
        expected_sequence: 1,
        idempotency_key: id(104),
      }),
      hasCode("invalid_turn"),
    );
    await assert.rejects(
      submitTurn(db, learnerThree, sessionId, {
        text: answer,
        expected_sequence: 1,
      } as never),
      hasCode("invalid_turn"),
    );

    const state = await getSession(db, learnerThree, sessionId);
    assert.equal(state.messages.length, 2);
    assert.deepEqual(
      state.messages.map((message) => message.sequence),
      [0, 1],
    );
    await assert.rejects(
      getSession(db, learnerFour, sessionId),
      hasCode("session_not_found"),
    );
    await assert.rejects(
      getSession(db, learnerThree, "bad"),
      hasCode("invalid_id"),
    );

    for (const [revoke, restore] of [
      [
        "update public.memberships set status='removed'",
        "update public.memberships set status='active'",
      ],
      [
        "update public.classes set active=false",
        "update public.classes set active=true",
      ],
      [
        "update public.lessons set archived_at=now() where id='" + id(50) + "'",
        "update public.lessons set archived_at=null where id='" + id(50) + "'",
      ],
    ]) {
      await sql.exec(revoke);
      await assert.rejects(
        getSession(db, learnerThree, sessionId),
        hasCode("session_not_found"),
      );
      const denied = await handleSessionApi(
        new Request(`http://localhost/api/sessions/${sessionId}`),
        async () => ({ db, actor: learnerThree }),
        sessionId,
      );
      assert.equal(denied.status, 404);
      assert.equal((await denied.json()).messages, undefined);
      await assert.rejects(
        submitTurn(db, learnerThree, sessionId, {
          text: answer,
          expected_sequence: 1,
          idempotency_key: id(100),
        }),
        hasCode("session_not_found"),
        "idempotent replay cannot bypass revocation",
      );
      const paused = await db.rpc("set_learning_session_paused", {
        p_learner: learnerThree.id,
        p_session_id: sessionId,
        p_pause: true,
      });
      assert.match(paused.error?.message ?? "", /session_not_found/);
      await sql.exec("reset role;set role authenticated");
      await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
        learnerThree.id,
      ]);
      assert.equal(
        (
          await sql.query("select id from public.sessions where id=$1", [
            sessionId,
          ])
        ).rows.length,
        0,
      );
      assert.equal(
        (
          await sql.query(
            "select id from public.messages where session_id=$1",
            [sessionId],
          )
        ).rows.length,
        0,
      );
      await sql.exec("reset role;set role service_role");
      await sql.exec(restore);
      assert.equal(
        (await getSession(db, learnerThree, sessionId)).messages.length,
        2,
      );
    }
    // Listing runs on the learner's session client: RLS must scope it, so run
    // these calls as authenticated roles with explicit JWT subjects.
    await sql.exec("reset role;set role authenticated");
    await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
      learnerThree.id,
    ]);
    const listed = await listPublishedLessons(db);
    assert.deepEqual(
      listed.map((lesson) => lesson.lesson_version_id).sort(),
      [id(51), id(71)].sort(),
    );
    await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
      learnerFour.id,
    ]);
    assert.equal((await listPublishedLessons(db)).length, 0);
    await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
      teacherTwo.id,
    ]);
    assert.deepEqual(
      (await listPublishedLessons(db)).map(
        (lesson) => lesson.lesson_version_id,
      ),
      [id(81)],
    );
    await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
      learnerFour.id,
    ]);
    assert.equal(
      (await sql.query("select * from public.sessions")).rows.length,
      0,
    );
    assert.equal(
      (await sql.query("select * from public.messages")).rows.length,
      0,
    );
    assert.equal(
      (await sql.query("select id from public.lesson_versions")).rows.length,
      0,
      "tightened policy must hide other classes' published versions",
    );
    await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
      learnerThree.id,
    ]);
    assert.deepEqual(
      (
        await sql.query<{ id: string }>(
          "select id from public.lesson_versions order by id",
        )
      ).rows.map((row) => row.id),
      [id(51), id(71)],
    );
    await sql.query("select set_config('request.jwt.claim.sub',$1,false)", [
      teacherOne.id,
    ]);
    assert.equal(
      (await sql.query("select * from public.sessions")).rows.length,
      0,
      "the class teacher must not read learner sessions",
    );
    assert.equal(
      (await sql.query("select * from public.messages")).rows.length,
      0,
      "the class teacher must not read session transcripts",
    );
    assert.equal(
      (
        await sql.query<{ id: string }>(
          "select id from public.lesson_versions order by id",
        )
      ).rows.length,
      3,
      "the lesson owner still sees their own versions",
    );
    await assert.rejects(
      sql.query("select public.open_learning_session($1,$2)", [
        learnerThree.id,
        id(51),
      ]),
      /permission denied/,
    );
    await assert.rejects(
      sql.query(
        "insert into public.sessions(learner_id,lesson_version_id,visibility) values($1,$2,'private')",
        [learnerThree.id, id(51)],
      ),
      /permission denied/,
    );
    await sql.exec("reset role;set role anon");
    await assert.rejects(
      sql.exec("select * from public.sessions"),
      /permission denied/,
    );
    await sql.exec("reset role;set role service_role");
    await assert.rejects(
      sql.exec(
        `update public.sessions set lesson_version_id='${id(52)}' where true`,
      ),
      /immutable/,
    );
    await assert.rejects(
      sql.query(
        `insert into public.sessions(learner_id,lesson_version_id,visibility) values('${learnerThree.id}','${id(52)}','class')`,
      ),
      /Lesson unavailable/,
      "the scope trigger must reject unpublished versions even for service-role inserts",
    );
  } finally {
    await sql.close();
  }
});

test("HTTP boundary with injected identity/database errors: auth before body, origin, bounded JSON, demo fail-closed and mapped turn conflicts", async () => {
  let called = false;
  const unauth = async () => {
    called = true;
    throw new IngestionError("unauthenticated", "Sign in.", 401);
  };
  const request = () =>
    new Request("http://localhost/api/sessions", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: "unread input",
    });
  const denied = request();
  assert.equal((await handleSessionApi(denied, unauth)).status, 401);
  assert.equal(denied.bodyUsed, false);
  assert.equal(called, true);
  called = false;
  const cross = request();
  cross.headers.set("origin", "https://other.invalid");
  assert.equal((await handleSessionApi(cross, unauth)).status, 403);
  assert.equal(called, false);
  const demo = async () => {
    throw new IngestionError(
      "live_setup_required",
      "Learning sessions require live mode.",
      503,
    );
  };
  const demoResponse = await handleSessionApi(request(), demo);
  assert.equal(demoResponse.status, 503);
  assert.equal((await demoResponse.json()).error_code, "live_setup_required");
  assert.equal(demoResponse.headers.get("cache-control"), "no-store");

  const rpcError = (message: string) => ({
    rpc: async () => ({ data: null, error: { message } }),
  });
  const missingMigration = {
    rpc: async () => ({
      data: null,
      error: {
        message:
          "Could not find function open_learning_session in schema cache",
      },
    }),
  } as unknown as SupabaseClient;
  const unavailable = await handleSessionApi(
    new Request("http://localhost/api/sessions", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
      },
      body: JSON.stringify({ lesson_version_id: id(51) }),
    }),
    async () => ({ db: missingMigration, actor: learnerThree }),
  );
  assert.equal(unavailable.status, 503);
  assert.equal(
    (await unavailable.json()).error_code,
    "session_storage_unavailable",
  );

  const lessonRow = {
    objectives_json: [{ id: "o1", title: "Explain heat flow" }],
    lessons: { title: "Fictional heat transfer" },
  };
  const successDb = {
    rpc: async () => ({
      data: {
        session: {
          id: id(300),
          status: "awaiting_student",
          visibility: "class",
          class_id: id(11),
          lesson_version_id: id(51),
          last_sequence: 0,
          opened_at: "2026-09-22T00:00:00Z",
        },
        message: {
          id: id(301),
          sequence: 0,
          role: "errby",
          text: INITIAL_QUESTION,
          turn_id: id(302),
          created_at: "2026-09-22T00:00:00Z",
        },
      },
      error: null,
    }),
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return { data: lessonRow, error: null };
        },
      };
    },
  } as unknown as SupabaseClient;
  const opened = await handleSessionApi(
    new Request("http://localhost/api/sessions", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
      },
      body: JSON.stringify({ lesson_version_id: id(51) }),
    }),
    async () => ({ db: successDb, actor: learnerThree }),
  );
  assert.equal(opened.status, 201);
  assert.equal((await opened.json()).messages[0].text, INITIAL_QUESTION);
  assert.equal(
    (
      await handleSessionApi(
        new Request("http://localhost/api/sessions", {
          method: "GET",
          headers: { origin: "http://localhost" },
        }),
        async () => ({ db: successDb, actor: learnerThree }),
      )
    ).status,
    405,
  );

  const turns = (body: unknown) =>
    new Request(`http://localhost/api/sessions/${id(300)}/turns`, {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  const access = (message?: string) =>
    message
      ? async () => ({
          db: rpcError(message) as unknown as SupabaseClient,
          actor: learnerThree,
        })
      : async () => ({ db: successDb, actor: learnerThree });
  assert.equal(
    (await handleSessionApi(turns("{"), access(), id(300), true)).status,
    400,
  );
  const large = turns("x".repeat(500001));
  large.headers.set("content-length", "1");
  assert.equal(
    (await handleSessionApi(large, access(), id(300), true)).status,
    413,
  );
  for (const [message, status, code] of [
    ["sequence_conflict", 409, "sequence_conflict"],
    ["session_forbidden", 404, "session_forbidden"],
  ] as const) {
    const response = await handleSessionApi(
      turns({
        text: "answer",
        expected_sequence: 0,
        idempotency_key: id(100),
      }),
      access(message),
      id(300),
      true,
    );
    assert.equal(response.status, status);
    assert.equal((await response.json()).error_code, code);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(
    (
      await handleSessionApi(
        new Request("http://localhost/api/sessions/bad", {
          method: "GET",
        }),
        access(),
        "bad",
      )
    ).status,
    400,
  );
});
