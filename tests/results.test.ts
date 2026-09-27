import assert from "node:assert/strict";
import test from "node:test";
import { summarizeEvidence } from "../src/lib/results/metrics";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { SupabaseClient } from "@supabase/supabase-js";
import { learnerResult } from "../src/lib/results/service";

test("learner results recheck access before any service-role reads", async () => {
  let reads = 0;
  const db = {
    rpc: async () => ({ error: { message: "session_not_found" } }),
    from: () => {
      reads++;
      throw new Error("must not read");
    },
  } as unknown as SupabaseClient;
  await assert.rejects(
    learnerResult(
      db,
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
    ),
  );
  assert.equal(reads, 0);
});

test("first independent scorable attempt, uncertainty and completion use saved evidence", () => {
  const goals = [
    { id: "heat", title: "Heat transfer", required: true },
    { id: "ice", title: "Melting", required: true },
  ];
  const attempts = [
    {
      objective_id: "heat",
      verdict: "unverified" as const,
      independent: true,
      assisted: false,
      sequence: 1,
    },
    {
      objective_id: "heat",
      verdict: "incorrect" as const,
      independent: true,
      assisted: false,
      sequence: 2,
    },
    {
      objective_id: "heat",
      verdict: "correct" as const,
      independent: true,
      assisted: false,
      sequence: 3,
    },
    {
      objective_id: "ice",
      verdict: "correct" as const,
      independent: false,
      assisted: true,
      sequence: 4,
    },
  ];
  const progress = [
    { objective_id: "heat", state: "explained" as const },
    { objective_id: "ice", state: "unverified" as const },
  ];
  assert.deepEqual(
    summarizeEvidence(goals, progress, attempts, false, "needs_review"),
    {
      label: "Unverified",
      explained: 1,
      required: 2,
      correct: 0,
      scorable: 1,
      unscored: 1,
      afterHelp: 0,
      corrections: 0,
      goals: [
        { id: "heat", title: "Heat transfer", state: "explained" },
        { id: "ice", title: "Melting", state: "unverified" },
      ],
    },
  );
  assert.equal(
    summarizeEvidence(goals, [], [], false, "ready").label,
    "Untested",
  );
  assert.equal(
    summarizeEvidence(
      goals,
      [
        { objective_id: "heat", state: "explained" },
        { objective_id: "ice", state: "explained" },
      ],
      attempts,
      false,
      "completed",
    ).label,
    "Explained",
  );
  assert.equal(
    summarizeEvidence(
      goals,
      [
        { objective_id: "heat", state: "explained" },
        { objective_id: "ice", state: "explained" },
      ],
      attempts,
      true,
      "completed",
    ).label,
    "Unverified",
  );
});

test("help metrics deduplicate misconceptions and preserve objective IDs with identical titles", () => {
  const summary = summarizeEvidence(
    [
      { id: "a", title: "Same", required: true },
      { id: "b", title: "Same", required: true },
    ],
    [{ objective_id: "a", state: "explained" }],
    [
      {
        objective_id: "a",
        verdict: "incorrect",
        independent: true,
        assisted: false,
        sequence: 1,
      },
      {
        objective_id: "a",
        verdict: "correct",
        independent: true,
        assisted: false,
        sequence: 3,
      },
    ],
    false,
    "awaiting_student",
    [
      { objective_id: "a", misconception_id: "m", resolved: true },
      { objective_id: "a", misconception_id: "m", resolved: true },
    ],
  );
  assert.equal(summary.afterHelp, 1);
  assert.equal(summary.corrections, 1);
  assert.equal(summary.correct, 0);
  assert.equal(summary.scorable, 1);
  assert.deepEqual(
    summary.goals.map((goal) => goal.id),
    ["a", "b"],
  );
});

test("PGlite: bounded activity and audited reviews enforce ownership, valid evidence and latest progress", async () => {
  const db = new PGlite();
  const id = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
    );
    for (const file of readdirSync("supabase/migrations")
      .filter((file) => file.endsWith(".sql"))
      .sort())
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    for (let n = 1; n <= 3; n++) {
      await db.query("insert into auth.users values($1)", [id(n)]);
      await db.query(
        "insert into public.profiles(auth_user_id,role,alias) values($1,$2,'Synthetic')",
        [id(n), n === 3 ? "learner" : "teacher"],
      );
    }
    await db.query(
      "insert into public.classes(id,teacher_id,title,grade_band,join_code_hash) values($1,$2,'Synthetic','middle_school','synthetic')",
      [id(4), id(1)],
    );
    await db.query(
      "insert into public.memberships(class_id,student_id,alias_in_class) values($1,$2,'Synthetic')",
      [id(4), id(3)],
    );
    await db.query(
      "insert into public.lessons(id,owner_id,class_id,title) values($1,$2,$3,'Synthetic')",
      [id(5), id(1), id(4)],
    );
    await db.query(
      `insert into public.lesson_versions(id,lesson_id,version,objectives_json,reference_json,provenance,initial_question,review_status,reviewer_id,reviewed_at)
      values($1,$2,1,'[{"id":"g","required":true,"reference_ids":["r"]}]','[{"id":"r","status":"source_checked","purpose":"evidence"}]','{}','Explain','published',$3,now())`,
      [id(6), id(5), id(1)],
    );
    await db.query(
      "update public.lessons set current_published_version=$1 where id=$2",
      [id(6), id(5)],
    );
    await db.query(
      "insert into public.sessions(id,learner_id,class_id,lesson_version_id,status,visibility) values($1,$2,$3,$4,'awaiting_student','class')",
      [id(7), id(3), id(4), id(6)],
    );
    const heartbeat = async (event: number, ms = 15000) =>
      (
        await db.query<{ ms: number }>(
          "select public.record_learning_activity($1,$2,$3,$4) as ms",
          [id(3), id(7), id(event), ms],
        )
      ).rows[0].ms;
    assert.equal(await heartbeat(30, 0), 0);
    await db.query(
      "update public.sessions set activity_last_at=now()-interval '30 seconds' where id=$1",
      [id(7)],
    );
    assert.equal(await heartbeat(31), 15000);
    assert.equal(await heartbeat(31), 0);
    await assert.rejects(heartbeat(32, 15001), /invalid_activity/);
    await db.query(
      "update public.sessions set status='evaluating' where id=$1",
      [id(7)],
    );
    assert.equal(await heartbeat(32), 0);
    await db.query(
      "update public.sessions set status='needs_review' where id=$1",
      [id(7)],
    );
    await db.query(
      "insert into public.messages(id,session_id,sequence,role,text,turn_id) values($1,$2,1,'student','Heat moves from warmer to cooler material.',$3)",
      [id(8), id(7), id(9)],
    );
    await db.query(
      `insert into public.evaluations(id,session_id,message_id,objective_id,verdict,learner_evidence_span,source_refs,assisted,independent,uncertainty_reason,rubric_version,model_id)
      values($1,$2,$3,'g','unverified','Heat moves from warmer to cooler material.','["r"]',false,true,'Review source','v1','synthetic')`,
      [id(10), id(7), id(8)],
    );
    await db.query(
      "insert into public.interventions(session_id,message_id,trigger,correction,objective_id) values($1,$2,'uncertainty','Review source','g')",
      [id(7), id(8)],
    );
    const revise = async (
      actor: number,
      verdict: string,
      expected = "unverified",
    ) =>
      (
        await db.query<{ state: string }>(
          "select public.revise_learning_assessment($1,$2,$3,$4,'Checked the saved answer against source r.') as state",
          [id(actor), id(10), expected, verdict],
        )
      ).rows[0].state;
    await assert.rejects(revise(2, "correct"), /review_denied/);
    assert.equal(await revise(1, "correct"), "completed");
    assert.equal(
      (
        await db.query<{ verdict: string }>(
          "select verdict from public.evaluations where id=$1",
          [id(10)],
        )
      ).rows[0].verdict,
      "unverified",
    );
    assert.equal(
      (await db.query("select * from public.assessment_revisions")).rows.length,
      1,
    );
    await assert.rejects(revise(1, "incorrect"), /stale_revision/);
    assert.equal(await revise(1, "incorrect", "correct"), "awaiting_student");
    await db.query(
      "insert into public.messages(id,session_id,sequence,role,text,turn_id) values($1,$2,2,'student','Newer incorrect explanation.',$3)",
      [id(13), id(7), id(14)],
    );
    await db.query(
      `insert into public.evaluations(id,session_id,message_id,objective_id,verdict,learner_evidence_span,source_refs,assisted,independent,rubric_version,model_id)
      values($1,$2,$3,'g','incorrect','Newer incorrect explanation.','["r"]',false,true,'v1','synthetic')`,
      [id(15), id(7), id(13)],
    );
    assert.equal(await revise(1, "correct", "incorrect"), "awaiting_student");
    assert.equal(
      (
        await db.query<{ state: string }>(
          "select state from public.objective_progress where session_id=$1",
          [id(7)],
        )
      ).rows[0].state,
      "developing",
    );
    // A copied supervisor correction cannot become completion via teacher override.
    await db.query(
      "insert into public.messages(id,session_id,sequence,role,text,turn_id) values($1,$2,0,'supervisor','Heat moves from warmer to cooler material.',$3)",
      [id(11), id(7), id(12)],
    );
    await assert.rejects(
      revise(1, "correct", "correct"),
      /invalid_completion_evidence/,
    );
    await db.query(
      "update public.memberships set status='removed' where class_id=$1",
      [id(4)],
    );
    await assert.rejects(heartbeat(33), /session_not_found/);
    await assert.rejects(revise(1, "partial", "correct"), /session_not_found/);
  } finally {
    await db.close();
  }
});
