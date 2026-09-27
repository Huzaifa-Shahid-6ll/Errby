import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { operate } from "../scripts/operations";

test("operator mutations require confirmation, bounded budgets and matching class IDs", async () => {
  let calls = 0;
  const db = {
    from() {
      calls++;
      return { upsert: async () => ({ error: null }) };
    },
    async rpc(name: string) {
      calls++;
      assert.equal(name, "expire_learner_records");
      return { data: 2 };
    },
  } as unknown as SupabaseClient;
  const budget = {
    action: "budget",
    capUsd: 1,
    maxCallUsd: 0.03,
    enabled: true,
  };
  await assert.rejects(operate(db, budget, false), /requires --confirm/);
  await assert.rejects(operate(db, { ...budget, capUsd: 1.01 }, true));
  await assert.rejects(operate(db, { ...budget, maxCallUsd: 0.031 }, true));
  await assert.rejects(
    operate(
      db,
      {
        action: "class-delete",
        classId: "00000000-0000-4000-a000-000000000001",
        confirmClassId: "00000000-0000-4000-a000-000000000002",
      },
      true,
    ),
    /does not match/,
  );
  await assert.rejects(
    operate(db, { action: "reconcile", confirmedBilling: false }, true),
  );
  assert.equal(calls, 0);
  assert.deepEqual(await operate(db, budget, true), {
    status: "budget_updated",
  });
  assert.deepEqual(await operate(db, { action: "retention" }, true), {
    status: "retention_ran",
    redactedMessages: 2,
  });
  assert.equal(calls, 2);
});
