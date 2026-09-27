import { pathToFileURL } from "node:url";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../src/lib/db/admin";

const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }).strict(),
  z
    .object({
      action: z.literal("budget"),
      capUsd: z.number().positive().max(1),
      maxCallUsd: z.number().positive().max(0.03),
      enabled: z.boolean(),
    })
    .strict(),
  z.object({ action: z.literal("retention") }).strict(),
  z
    .object({
      action: z.literal("reconcile"),
      requestKey: z.uuid(),
      tokens: z.number().int().nonnegative(),
      cost: z.number().nonnegative().max(0.03),
      modelId: z.string().min(1).max(200),
      providerId: z.string().min(1).max(200),
      confirmedBilling: z.literal(true),
    })
    .strict(),
  z
    .object({
      action: z.literal("class-delete"),
      classId: z.uuid(),
      confirmClassId: z.uuid(),
    })
    .strict(),
]);

export async function operate(
  db: SupabaseClient,
  raw: unknown,
  confirmed: boolean,
) {
  const command = commandSchema.parse(raw);
  if (command.action !== "status" && !confirmed)
    throw new Error("Mutation requires --confirm");
  if (command.action === "status") {
    const [budget, ledger] = await Promise.all([
      db
        .from("model_budget")
        .select("enabled,cap_usd,max_call_usd")
        .maybeSingle(),
      db
        .from("usage_ledger")
        .select(
          "request_key,provider_status,reserved_cost,actual_cost,lease_until,model_id,provider_request_id",
        ),
    ]);
    if (budget.error || ledger.error)
      throw new Error("Budget status unavailable");
    const rows = ledger.data ?? [];
    return {
      budget: budget.data,
      committedUsd: rows.reduce(
        (sum, row) =>
          sum +
          Number(
            ["reserved", "pending"].includes(row.provider_status)
              ? row.reserved_cost
              : (row.actual_cost ?? 0),
          ),
        0,
      ),
      unresolved: rows.filter((row) =>
        ["reserved", "pending"].includes(row.provider_status),
      ),
    };
  }
  if (command.action === "budget") {
    const { error } = await db.from("model_budget").upsert({
      id: true,
      cap_usd: command.capUsd,
      max_call_usd: command.maxCallUsd,
      enabled: command.enabled,
    });
    if (error) throw new Error("Budget update failed");
    return { status: "budget_updated" };
  }
  if (command.action === "retention") {
    const { data, error } = await db.rpc("expire_learner_records");
    if (error) throw new Error("Retention run failed");
    return { status: "retention_ran", redactedMessages: data };
  }
  if (command.action === "reconcile") {
    const { error } = await db.rpc("settle_model_cost", {
      p_request_key: command.requestKey,
      p_status: "failed",
      p_tokens: command.tokens,
      p_actual_cost: command.cost,
      p_model_id: command.modelId,
      p_provider_id: command.providerId,
    });
    if (error)
      throw new Error("Reconciliation failed; reservation remains unchanged");
    return { status: "billing_reconciled_response_unavailable" };
  }
  if (command.classId !== command.confirmClassId)
    throw new Error("Class UUID confirmation does not match");
  const { data, error } = await db
    .from("classes")
    .delete()
    .eq("id", command.classId)
    .select("id")
    .single();
  if (error || !data) throw new Error("Class deletion could not be confirmed");
  return { status: "class_and_related_data_deleted", classId: data.id };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (process.env.ERRBY_OPERATOR_CONFIRM !== "synthetic-test-project")
      throw new Error("Confirm the synthetic hosted test project first");
    const url = new URL(process.env.SUPABASE_URL ?? "");
    if (
      url.protocol !== "https:" ||
      !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
    )
      throw new Error("Use a hosted Supabase synthetic test project");
    let input = "";
    for await (const chunk of process.stdin) {
      input += chunk;
      if (Buffer.byteLength(input) > 4096)
        throw new Error("Command exceeds limit");
    }
    console.log(
      JSON.stringify(
        await operate(
          createAdminClient(),
          JSON.parse(input),
          process.argv.includes("--confirm"),
        ),
      ),
    );
  } catch {
    // Never expose provider payloads, command contents, environment or credentials.
    console.error(
      "Operation failed. Check command fields, --confirm, live synthetic configuration and database access.",
    );
    process.exitCode = 1;
  }
}
