import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { SupabaseClient } from "@supabase/supabase-js";
import { exampleLessons } from "../src/lib/lessons/examples";
import { evaluateAnswer } from "../src/lib/ai/evaluate";
import { handleSessionVisual } from "../src/lib/sessions/visual";
import { getSession } from "../src/lib/sessions/service";
import { processSession } from "../src/lib/sessions/process";
import { visualSchema } from "../src/lib/visuals/schema";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const actor = { id: id(3), role: "learner" as const };
const visual = visualSchema.parse({
  version: 1,
  kind: "linear_graph",
  id: id(80),
  revision: 0,
  title: "Explore a straight line",
  caption: "Illustrative example, not measured data.",
  slope: 1,
  intercept: 0,
  comparison: null,
});

test("PGlite: graph history, owner/message/revision fences, atomic updates and assistance cannot complete objectives", async () => {
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
      teacher_review: { status: "pending" },
    };
    await sql.query("insert into auth.users values($1)", [actor.id]);
    await sql.query(
      "insert into profiles(auth_user_id,role,alias) values($1,'learner','Synthetic adult')",
      [actor.id],
    );
    await sql.query(
      "insert into lessons(id,owner_id,title) values($1,$2,'Synthetic lesson')",
      [id(50), actor.id],
    );
    await sql.query(
      "insert into lesson_versions(id,lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,lesson_json,content_hash) values($1,$2,1,$3,$4,'{}',$5,'private_ready',$6,repeat('a',64))",
      [
        id(51),
        id(50),
        JSON.stringify(lesson.objectives),
        JSON.stringify(lesson.references),
        lesson.initial_question,
        JSON.stringify(lesson),
      ],
    );
    const rpc = async <T>(
      name: string,
      args: Record<string, unknown>,
    ): Promise<T> => {
      assert.match(name, /^[a-z_]+$/);
      const entries = Object.entries(args);
      return (
        await sql.query<{ value: T }>(
          `select public.${name}(${entries.map(([key], i) => `${key}=>$${i + 1}`).join(",")}) as value`,
          entries.map(([, value]) =>
            value !== null && typeof value === "object"
              ? JSON.stringify(value)
              : value,
          ),
        )
      ).rows[0].value;
    };
    const sessionId = await rpc<string>("open_private_chat_with_visual", {
      p_learner: actor.id,
      p_version: id(51),
      p_visual: visual,
    });
    assert.equal(
      await rpc("open_private_chat_with_visual", {
        p_learner: actor.id,
        p_version: id(51),
        p_visual: visual,
      }),
      sessionId,
    );
    assert.equal(
      (
        await sql.query<{ visual_assistance: boolean }>(
          "select visual_assistance from messages where session_id=$1 and sequence=0",
          [sessionId],
        )
      ).rows[0].visual_assistance,
      true,
    );
    await assert.rejects(
      rpc("open_private_chat_with_visual", {
        p_learner: actor.id,
        p_version: id(51),
        p_visual: { ...visual, slope: 4 },
      }),
      /visual_conflict/,
    );
    await assert.rejects(
      rpc("open_private_chat_with_visual", {
        p_learner: id(4),
        p_version: id(51),
        p_visual: visual,
      }),
      /private_lesson_denied/,
    );
    const base = { p_learner: actor.id, p_session_id: sessionId };
    const ask = await rpc<{ message: { id: string } }>(
      "record_student_visual_turn",
      {
        ...base,
        p_turn_id: id(60),
        p_text: "Show a graph",
        p_expected_sequence: 0,
        p_visual_request: true,
        p_current_visual: null,
      },
    );
    const claim = await rpc<{ token: string }>("claim_learning_turn", base);
    const reply = {
      kind: "reply",
      role: "errby",
      text: "What changes when the slope changes?",
      reference_ids: [],
      misconception_id: null,
      visual,
    };
    await rpc("finish_learning_turn", {
      ...base,
      p_token: claim.token,
      p_message_id: ask.message.id,
      p_assessments: [],
      p_rubric_version: "synthetic",
      p_model_id: "synthetic",
      p_reply: reply,
    });
    const graphMessage = (
      await sql.query<{ id: string; visual_json: unknown }>(
        "select id,visual_json from messages where session_id=$1 and visual_json is not null",
        [sessionId],
      )
    ).rows[0];
    assert.deepEqual(graphMessage.visual_json, visual);
    assert.equal(
      (
        await sql.query("select * from evaluations where session_id=$1", [
          sessionId,
        ])
      ).rows.length,
      0,
    );
    const save = {
      ...base,
      p_message_id: graphMessage.id,
      p_visual: { ...visual, slope: 2 },
    };
    await assert.rejects(
      rpc("save_chat_visual", { ...save, p_learner: id(4) }),
      /session_not_found/,
    );
    await assert.rejects(
      rpc("save_chat_visual", { ...save, p_message_id: id(99) }),
      /visual_not_found/,
    );
    await assert.rejects(
      rpc("save_chat_visual", {
        ...save,
        p_visual: { ...visual, title: "Forged evidence" },
      }),
      /invalid_visual/,
    );
    await assert.rejects(
      rpc("save_chat_visual", {
        ...save,
        p_visual: { ...visual, comparison: { slope: 2, intercept: 1 } },
      }),
      /invalid_visual/,
    );
    await assert.rejects(
      rpc("save_chat_visual", { ...save, p_visual: { ...visual, slope: 99 } }),
      /invalid_visual/,
    );
    const saved = await rpc<typeof visual>("save_chat_visual", save);
    assert.equal(saved.revision, 1);
    await assert.rejects(rpc("save_chat_visual", save), /visual_conflict/);
    await assert.rejects(
      rpc("record_student_visual_turn", {
        ...base,
        p_turn_id: id(69),
        p_text: "Stale sequence",
        p_expected_sequence: 99,
        p_visual_request: true,
        p_current_visual: { ...saved, slope: 4 },
      }),
      /sequence_conflict/,
    );
    assert.deepEqual(
      (
        await sql.query<{ visual_json: unknown }>(
          "select visual_json from messages where id=$1",
          [graphMessage.id],
        )
      ).rows[0].visual_json,
      saved,
    );
    const learnerText = "The warmer room transfers energy into the ice.";
    const second = await rpc<{ message: { id: string } }>(
      "record_student_visual_turn",
      {
        ...base,
        p_turn_id: id(61),
        p_text: learnerText,
        p_expected_sequence: 2,
        p_visual_request: false,
        p_current_visual: null,
      },
    );
    const secondClaim = await rpc<{ token: string }>(
      "claim_learning_turn",
      base,
    );
    const assessments = lesson.objectives.map((objective) => ({
      objective_id: objective.id,
      verdict: "correct",
      learner_quote: learnerText,
      reason: "Synthetic attempted independent credit",
      reference_ids: objective.reference_ids,
      independent: true,
      assisted: false,
      uncertainty_reason: null,
    }));
    await rpc("finish_learning_turn", {
      ...base,
      p_token: secondClaim.token,
      p_message_id: second.message.id,
      p_assessments: assessments,
      p_rubric_version: "synthetic",
      p_model_id: "synthetic",
      p_reply: { ...reply, visual: undefined },
    });
    const evidence = await sql.query<{
      independent: boolean;
      assisted: boolean;
    }>("select independent,assisted from evaluations where session_id=$1", [
      sessionId,
    ]);
    assert.ok(evidence.rows.length);
    assert.ok(evidence.rows.every((row) => !row.independent && row.assisted));
    assert.equal(
      (
        await sql.query<{ status: string }>(
          "select status from sessions where id=$1",
          [sessionId],
        )
      ).rows[0].status,
      "awaiting_student",
    );
    const updateArgs = {
      ...base,
      p_turn_id: id(62),
      p_text: "Compare a negative slope",
      p_expected_sequence: 4,
      p_visual_request: true,
      p_current_visual: { ...saved, slope: 3 },
    };
    const updatedAsk = await rpc<{ message: { id: string } }>(
      "record_student_visual_turn",
      updateArgs,
    );
    assert.deepEqual(
      await rpc("record_student_visual_turn", updateArgs),
      updatedAsk,
    );
    await assert.rejects(
      rpc("record_student_visual_turn", {
        ...updateArgs,
        p_visual_request: false,
      }),
      /turn_conflict/,
    );
    await assert.rejects(
      rpc("record_student_visual_turn", {
        ...updateArgs,
        p_current_visual: { ...saved, slope: 4 },
      }),
      /turn_conflict/,
    );
    const updateClaim = await rpc<{ token: string }>(
      "claim_learning_turn",
      base,
    );
    const updated = {
      ...saved,
      revision: 3,
      slope: 3,
      comparison: { slope: -3, intercept: 0 },
    };
    const finishArgs = {
      ...base,
      p_token: updateClaim.token,
      p_message_id: updatedAsk.message.id,
      p_assessments: assessments,
      p_rubric_version: "synthetic",
      p_model_id: "synthetic",
      p_reply: { ...reply, visual: updated },
    };
    await assert.rejects(
      rpc("finish_learning_turn", {
        ...finishArgs,
        p_reply: { ...reply, visual: { ...updated, revision: 2 } },
      }),
      /visual_conflict/,
    );
    await assert.rejects(
      rpc("finish_learning_turn", {
        ...finishArgs,
        p_message_id: ask.message.id,
      }),
      /invalid_turn/,
    );
    await rpc("finish_learning_turn", finishArgs);
    const restored = await sql.query<{ id: string; visual_json: unknown }>(
      "select id,visual_json from messages where session_id=$1 and visual_json is not null",
      [sessionId],
    );
    assert.equal(restored.rows.length, 1);
    assert.equal(restored.rows[0].id, graphMessage.id);
    assert.deepEqual(restored.rows[0].visual_json, updated);
    assert.equal(
      (
        await sql.query("select * from evaluations where message_id=$1", [
          updatedAsk.message.id,
        ])
      ).rows.length,
      0,
    );
    const grants = await sql.query<{ allowed: boolean }>(
      "select has_function_privilege('authenticated','public.save_chat_visual(uuid,uuid,uuid,jsonb)','execute') as allowed",
    );
    assert.equal(grants.rows[0].allowed, false);
    const unsupported = await rpc<{ message: { id: string } }>(
      "record_student_visual_turn",
      {
        ...base,
        p_turn_id: id(63),
        p_text: "Explain an unsupported curve",
        p_expected_sequence: 6,
        p_visual_request: true,
        p_current_visual: null,
      },
    );
    const unsupportedClaim = await rpc<{ token: string }>(
      "claim_learning_turn",
      base,
    );
    await rpc("finish_learning_turn", {
      ...base,
      p_token: unsupportedClaim.token,
      p_message_id: unsupported.message.id,
      p_assessments: [],
      p_rubric_version: "synthetic",
      p_model_id: "synthetic",
      p_reply: { ...reply, visual: undefined },
    });
    assert.equal(
      (
        await sql.query<{ visual_assistance: boolean }>(
          "select visual_assistance from messages where session_id=$1 order by sequence desc limit 1",
          [sessionId],
        )
      ).rows[0].visual_assistance,
      true,
    );
    assert.equal(
      await rpc("open_private_chat_with_visual", {
        p_learner: actor.id,
        p_version: id(51),
        p_visual: visual,
      }),
      sessionId,
    );
    await assert.rejects(
      rpc("open_private_chat_with_visual", {
        p_learner: actor.id,
        p_version: id(51),
        p_visual: { ...visual, slope: 4 },
      }),
      /visual_conflict/,
    );
  } finally {
    await sql.close();
  }
});

test("visual save HTTP validation and saved descriptor projection make no model request", async () => {
  let calls = 0;
  const db = {
    async rpc(name: string) {
      calls++;
      return name === "assert_learning_session_access"
        ? { error: null }
        : { data: visual, error: null };
    },
    from(table: string) {
      const rows =
        table === "messages"
          ? [
              {
                id: id(10),
                sequence: 0,
                role: "errby",
                text: "Explore this example",
                created_at: "2026-10-01",
                visual_json: visual,
                visual_assistance: true,
              },
            ]
          : table === "sessions"
            ? [
                {
                  id: id(20),
                  status: "awaiting_student",
                  visibility: "private",
                  lesson_version_id: id(51),
                  last_sequence: 0,
                  opened_at: "2026-10-01",
                },
              ]
            : table === "lesson_versions"
              ? [{ lessons: { title: "Synthetic" }, objectives_json: [] }]
              : [];
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        maybeSingle: async () => ({ data: rows[0], error: null }),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({ data: rows, error: null }).then(resolve),
      };
      return query;
    },
  } as unknown as SupabaseClient;
  const state = await getSession(db, actor, id(20));
  assert.deepEqual(state.messages[0].visual, visual);
  assert.equal(state.messages[0].visual_assistance, true);
  const request = (body: unknown, origin = "https://errby.test") =>
    new Request(`https://errby.test/api/sessions/${id(20)}/visual`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const access = async () => ({ db, actor });
  const accepted = await handleSessionVisual(
    request({ message_id: id(10), visual }),
    access,
    id(20),
  );
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { visual });
  const before = calls;
  assert.equal(
    (
      await handleSessionVisual(
        request({ message_id: id(10), visual: { ...visual, slope: 100 } }),
        access,
        id(20),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleSessionVisual(
        request({ message_id: id(10), visual }, "https://other.test"),
        access,
        id(20),
      )
    ).status,
    403,
  );
  assert.equal(calls, before);
});

test("evaluator receives visual help and rejects independent credit for an immediate supplied answer", async () => {
  const lesson = exampleLessons[0];
  const answer = "The warmer room transfers heat into the ice.";
  const result = await evaluateAnswer(
    {
      db: {} as SupabaseClient,
      ownerId: actor.id,
      messageId: id(90),
      lesson,
      learnerAnswer: answer,
      conversation: [],
      visualAssistance: [visual],
      visualAssisted: true,
    },
    async (request) => {
      assert.deepEqual(
        (request.input as { visual_assistance: unknown }).visual_assistance,
        [visual],
      );
      return {
        model: "synthetic",
        tokens: 1,
        output: {
          assessments: [
            {
              objective_id: lesson.objectives[0].id,
              verdict: "correct",
              learner_quote: answer,
              reason: "Synthetic supplied answer",
              reference_ids: lesson.objectives[0].reference_ids,
              independent: true,
              assisted: false,
              uncertainty_reason: null,
            },
          ],
        },
      };
    },
  );
  assert.equal(result.decision.assessments[0].independent, false);
  assert.equal(result.decision.assessments[0].assisted, true);
});

test("saved visual requests call only the visual provider and commit through the fenced turn", async () => {
  const lesson = {
    ...structuredClone(exampleLessons[0]),
    illustrative_only: false,
    teacher_review: { status: "pending" },
  };
  let finished = false;
  let visualCalls = 0;
  const db = {
    async rpc(name: string, args: Record<string, unknown>) {
      if (name === "claim_learning_turn")
        return {
          data: { token: id(91), lesson_version_id: id(51) },
          error: null,
        };
      if (name === "finish_learning_turn") {
        assert.deepEqual(args.p_assessments, []);
        assert.equal(args.p_message_id, id(90));
        assert.deepEqual((args.p_reply as { visual: unknown }).visual, {
          ...visual,
          revision: 1,
          slope: -1,
        });
        finished = true;
      }
      return { data: null, error: null };
    },
    from(table: string) {
      const rows =
        table === "sessions"
          ? [
              {
                id: id(20),
                status: finished ? "awaiting_student" : "evaluating",
                visibility: "private",
                lesson_version_id: id(51),
                last_sequence: finished ? 2 : 1,
                opened_at: "2026-10-01",
              },
            ]
          : table === "messages"
            ? [
                {
                  id: id(10),
                  sequence: 0,
                  role: "errby",
                  text: "Explore this example",
                  created_at: "2026-10-01",
                  visual_json: visual,
                  visual_assistance: true,
                },
                {
                  id: id(90),
                  sequence: 1,
                  role: "student",
                  text: "Show negative slope",
                  created_at: "2026-10-01",
                  visual_request: true,
                },
              ]
            : table === "lesson_versions"
              ? [
                  {
                    lessons: { title: "Synthetic" },
                    objectives_json: lesson.objectives,
                    lesson_json: lesson,
                    review_status: "private_ready",
                  },
                ]
              : [];
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        single: async () => ({ data: rows[0], error: null }),
        maybeSingle: async () => ({ data: rows[0], error: null }),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({ data: rows, error: null }).then(resolve),
      };
      return query;
    },
  } as unknown as SupabaseClient;
  const state = await processSession(db, actor, id(20), {
    evaluateAnswer: async () => {
      throw new Error("Visual help must not be evaluated");
    },
    generateReply: async () => {
      throw new Error("Visual help uses its bounded provider");
    },
    generateVisualReply: async (input) => {
      visualCalls++;
      assert.deepEqual(input.current_visual, visual);
      assert.equal(input.message, "Show negative slope");
      const context = input.context as {
        references: { status: string; purpose: string }[];
      };
      assert.ok(
        context.references.every(
          (reference) =>
            reference.status === "source_checked" &&
            reference.purpose === "evidence",
        ),
      );
      return {
        text: "What changed?",
        visual: { ...visual, revision: 1, slope: -1 },
      };
    },
  });
  assert.equal(visualCalls, 1);
  assert.equal(state.session.status, "awaiting_student");
  assert.equal("processing_error" in state, false);
});
