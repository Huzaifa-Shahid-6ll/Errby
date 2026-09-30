import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { SupabaseClient } from "@supabase/supabase-js";
import { exampleLessons } from "../src/lib/lessons/examples";
import { evaluateAnswer } from "../src/lib/ai/evaluate";
import { generateReply } from "../src/lib/ai/reply";
import {
  openSession,
  submitTurn,
  setSessionPaused,
} from "../src/lib/sessions/service";
import { processSession } from "../src/lib/sessions/process";

const actor = {
  id: "00000000-0000-4000-8000-000000000003",
  role: "learner" as const,
};
const versionId = "00000000-0000-4000-8000-000000000051";
const lessonId = "00000000-0000-4000-8000-000000000050";

test("PGlite + mocked provider: atomic multi-turn teaching, recovery, fencing, pause and revoked access", async () => {
  const sql = new PGlite();
  try {
    await sql.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('sub','user_' || replace(current_setting('request.jwt.claim.sub',true),'-',''),'iss','https://synthetic.clerk.accounts.dev','role','authenticated')$$;grant usage on schema auth,public to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
    );
    for (const file of readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await sql.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    const lesson = {
      ...structuredClone(exampleLessons[0]),
      illustrative_only: false,
      teacher_review: { status: "pending" as const },
    };
    await sql.query("insert into auth.users values($1)", [actor.id]);
    await sql.query(
      "insert into profiles(auth_user_id,role,alias) values($1,'learner','Synthetic adult')",
      [actor.id],
    );
    await sql.query(
      "insert into lessons(id,owner_id,title) values($1,$2,'Synthetic lesson')",
      [lessonId, actor.id],
    );
    await sql.query(
      "insert into lesson_versions(id,lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,lesson_json,content_hash) values($1,$2,1,$3,$4,'{}',$5,'private_ready',$6,repeat('a',64))",
      [
        versionId,
        lessonId,
        JSON.stringify(lesson.objectives),
        JSON.stringify(lesson.references),
        lesson.initial_question,
        JSON.stringify(lesson),
      ],
    );
    const openedChat = await sql.query<{ id: string }>(
      "select public.open_private_chat($1,$2) as id",
      [actor.id, versionId],
    );
    const replayChat = await sql.query<{ id: string }>(
      "select public.open_private_chat($1,$2) as id",
      [actor.id, versionId],
    );
    assert.equal(openedChat.rows[0].id, replayChat.rows[0].id);
    await assert.rejects(
      sql.query("select public.open_private_chat($1,$2)", [
        "00000000-0000-4000-8000-000000000099",
        versionId,
      ]),
      /private_lesson_denied/,
    );
    assert.equal(
      (
        await sql.query<{ allowed: boolean }>(
          "select has_function_privilege('authenticated','public.open_private_chat(uuid,uuid)','execute') as allowed",
        )
      ).rows[0].allowed,
      false,
    );
    const db = {
      async rpc(name: string, args: Record<string, unknown>) {
        assert.match(name, /^[a-z_]+$/);
        try {
          const entries = Object.entries(args);
          const result = await sql.query<{ value: unknown }>(
            `select public.${name}(${entries.map(([key], i) => `${key}=>$${i + 1}`).join(",")}) as value`,
            entries.map(([, value]) =>
              typeof value === "object" ? JSON.stringify(value) : value,
            ),
          );
          return { data: result.rows[0]?.value, error: null };
        } catch (error) {
          return { data: null, error: { message: (error as Error).message } };
        }
      },
      from(table: string) {
        assert.match(table, /^[a-z_]+$/);
        const filters: string[] = [];
        const values: unknown[] = [];
        let order = "";
        let embed = false;
        async function rows() {
          const where = filters.length ? ` where ${filters.join(" and ")}` : "";
          const query = embed
            ? `select v.*,jsonb_build_object('title',l.title) as lessons from lesson_versions v join lessons l on l.id=v.lesson_id${where.replace(/id=/, "v.id=")}`
            : `select * from public.${table}${where}${order}`;
          return (await sql.query(query, values)).rows;
        }
        const q = {
          select(columns: string) {
            embed = columns.includes(
              "lessons!lesson_versions_lesson_id_fkey!inner",
            );
            return q;
          },
          eq(column: string, value: unknown) {
            assert.match(column, /^[a-z_]+$/);
            values.push(value);
            filters.push(`${column}=$${values.length}`);
            return q;
          },
          order(column: string, { ascending }: { ascending: boolean }) {
            assert.match(column, /^[a-z_]+$/);
            order = ` order by ${column} ${ascending ? "asc" : "desc"}`;
            return q;
          },
          async single() {
            return { data: (await rows())[0], error: null };
          },
          async maybeSingle() {
            return q.single();
          },
          then(
            resolve: (value: unknown) => void,
            reject: (error: unknown) => void,
          ) {
            return rows().then(
              (data) => resolve({ data, error: null }),
              reject,
            );
          },
        };
        return q;
      },
    } as unknown as SupabaseClient;
    await sql.exec("set role service_role");
    assert.equal(
      (
        await sql.query<{ allowed: boolean }>(
          "select has_function_privilege('authenticated','public.finish_learning_turn(uuid,uuid,uuid,uuid,jsonb,text,text,jsonb)','execute') as allowed",
        )
      ).rows[0].allowed,
      false,
    );
    let target = lesson.objectives[0];
    let verdict: "correct" | "incorrect" | "unverified" = "correct";
    let independent = true;
    let calls = 0;
    const providers = {
      evaluateAnswer: (input: Parameters<typeof evaluateAnswer>[0]) =>
        evaluateAnswer(input, async () => {
          calls++;
          return {
            model: "synthetic-model",
            tokens: 0,
            output: {
              assessments: [
                {
                  objective_id: target.id,
                  verdict,
                  learner_quote: input.learnerAnswer.slice(0, 100),
                  reason: "Synthetic check",
                  reference_ids: target.reference_ids,
                  assisted: !independent,
                  independent,
                  uncertainty_reason:
                    verdict === "unverified" ? "Conflicting evidence" : null,
                },
              ],
              supervisor:
                verdict === "correct"
                  ? { trigger: "none" }
                  : {
                      trigger:
                        verdict === "incorrect" ? "correction" : "uncertainty",
                      text: "Check the source and explain a changed example.",
                      reference_ids: target.reference_ids,
                    },
            },
          };
        }),
      generateReply: (input: Parameters<typeof generateReply>[0]) =>
        generateReply(input, async (request) => ({
          model: "synthetic-model",
          tokens: 0,
          output: { text: (request.input as { question: string }).question },
        })),
    };
    const start = () =>
      openSession(db, actor, { lesson_version_id: versionId });
    const send = async (
      id: string,
      sequence: number,
      text = "Energy moves from a warmer object into a cooler object because of their temperature difference.",
    ) =>
      submitTurn(db, actor, id, {
        text,
        expected_sequence: sequence,
        idempotency_key: crypto.randomUUID(),
      });
    const opened = await start();
    await send(opened.session.id, 0);
    let state = await processSession(db, actor, opened.session.id, providers);
    assert.equal(state.session.status, "awaiting_student");
    assert.equal(state.messages.length, 3);
    assert.equal(
      state.messages[2].text,
      lesson.objectives[1].follow_up_questions[0],
    );
    const before = calls;
    await processSession(db, actor, opened.session.id, providers);
    assert.equal(calls, before, "duplicate process does not call provider");
    for (target of lesson.objectives.slice(1)) {
      await send(state.session.id, state.session.last_sequence);
      state = await processSession(db, actor, state.session.id, providers);
    }
    assert.equal(state.session.status, "completed");
    const count = await sql.query<{ count: number }>(
      "select count(*)::int as count from evaluations where session_id=$1",
      [state.session.id],
    );
    assert.equal(count.rows[0].count, lesson.objectives.length);

    const wrong = await start();
    target = lesson.objectives[0];
    verdict = "incorrect";
    independent = false;
    await send(
      wrong.session.id,
      0,
      "The cooler object sends cold into the warmer object.",
    );
    state = await processSession(db, actor, wrong.session.id, providers);
    assert.equal(state.session.status, "awaiting_student");
    assert.equal(state.messages.at(-1)?.role, "supervisor");
    assert.ok(
      state.messages.at(-1)?.text.includes(target.application_question),
    );
    verdict = "correct";
    await send(
      wrong.session.id,
      state.session.last_sequence,
      state.messages.at(-1)!.text,
    );
    state = await processSession(db, actor, wrong.session.id, providers);
    assert.notEqual(
      state.session.status,
      "completed",
      "copied correction cannot complete",
    );
    independent = true;
    await send(
      wrong.session.id,
      state.session.last_sequence,
      "A warm hand loses energy to a cold glass because energy moves from higher temperature to lower temperature.",
    );
    state = await processSession(db, actor, wrong.session.id, providers);
    assert.equal(
      (
        await sql.query<{ resolved: boolean }>(
          "select resolved from interventions where session_id=$1",
          [wrong.session.id],
        )
      ).rows[0].resolved,
      true,
    );
    assert.equal(
      state.messages.at(-1)?.text,
      lesson.objectives[1].follow_up_questions[0],
    );

    const uncertain = await start();
    verdict = "unverified";
    independent = false;
    await send(uncertain.session.id, 0);
    state = await processSession(db, actor, uncertain.session.id, providers);
    assert.equal(state.session.status, "needs_review");

    verdict = "correct";
    independent = true;
    const retry = await start();
    await send(retry.session.id, 0);
    state = await processSession(db, actor, retry.session.id, {
      ...providers,
      evaluateAnswer: async () => {
        throw new Error("Synthetic outage");
      },
    });
    assert.ok(state.processing_error);
    assert.equal(state.messages.length, 2);
    assert.equal(state.session.status, "evaluating");
    state = await processSession(db, actor, retry.session.id, providers);
    assert.equal(state.messages.length, 3);

    const concurrent = await start();
    await send(concurrent.session.id, 0);
    const callsBefore = calls;
    const results = await Promise.all([
      processSession(db, actor, concurrent.session.id, providers),
      processSession(db, actor, concurrent.session.id, providers),
    ]);
    assert.equal(calls, callsBefore + 1, "concurrent retries evaluate once");
    assert.ok(results.some((result) => result.messages.length === 3));
    assert.equal(
      (
        await sql.query<{ count: number }>(
          "select count(*)::int as count from evaluations where session_id=$1",
          [concurrent.session.id],
        )
      ).rows[0].count,
      1,
    );

    const fenced = await start();
    const saved = await send(fenced.session.id, 0);
    const first = await db.rpc("claim_learning_turn", {
      p_learner: actor.id,
      p_session_id: fenced.session.id,
    });
    const duplicate = await db.rpc("claim_learning_turn", {
      p_learner: actor.id,
      p_session_id: fenced.session.id,
    });
    assert.equal(duplicate.data, null);
    await sql.query(
      "update sessions set lease_until=now()-interval '1 second' where id=$1",
      [fenced.session.id],
    );
    const second = await db.rpc("claim_learning_turn", {
      p_learner: actor.id,
      p_session_id: fenced.session.id,
    });
    assert.notEqual(first.data.token, second.data.token);
    const finish = await db.rpc("finish_learning_turn", {
      p_learner: actor.id,
      p_session_id: fenced.session.id,
      p_token: first.data.token,
      p_message_id: saved.message.id,
      p_assessments: [],
      p_rubric_version: "test",
      p_model_id: "test",
      p_reply: {},
    });
    assert.match(finish.error!.message, /processing_lease_lost/);
    await db.rpc("release_learning_turn", {
      p_learner: actor.id,
      p_session_id: fenced.session.id,
      p_token: second.data.token,
    });
    state = await processSession(db, actor, fenced.session.id, {
      ...providers,
      evaluateAnswer: async (input) => {
        await setSessionPaused(db, actor, fenced.session.id, true);
        return providers.evaluateAnswer(input);
      },
    });
    assert.equal(state.session.status, "paused");
    assert.equal(state.messages.length, 2);
    await setSessionPaused(db, actor, fenced.session.id, false);
    state = await processSession(db, actor, fenced.session.id, providers);
    assert.equal(state.session.status, "awaiting_student");

    const revoked = await start();
    await send(revoked.session.id, 0);
    await assert.rejects(
      processSession(db, actor, revoked.session.id, {
        ...providers,
        evaluateAnswer: async (input) => {
          await sql.query("update lessons set archived_at=now() where id=$1", [
            lessonId,
          ]);
          return providers.evaluateAnswer(input);
        },
      }),
      /unavailable for your account/,
    );
    assert.equal(
      (
        await sql.query<{ count: number }>(
          "select count(*)::int as count from evaluations where session_id=$1",
          [revoked.session.id],
        )
      ).rows[0].count,
      0,
    );
  } finally {
    await sql.close();
  }
});
