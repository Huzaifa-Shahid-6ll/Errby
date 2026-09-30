import { createClerkClient } from "@clerk/backend";
import { createAdminClient } from "../src/lib/db/admin";
import { env } from "../src/lib/env/server";
import {
  clerkAccountCommand,
  provisionClerkAccount,
} from "../src/lib/auth/clerk-provision";

// JSON array from stdin; dry-run by default. No passwords, email matching or
// automatic imports. The operator must verify each old UUID / Clerk ID pair.
try {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 100_000) throw new Error("Account manifest too large");
  }
  const commands = clerkAccountCommand
    .array()
    .min(1)
    .max(100)
    .parse(JSON.parse(input));
  if (new Set(commands.map((c) => c.clerkUserId)).size !== commands.length)
    throw new Error("Duplicate identities in manifest");
  const apply = process.argv.includes("--apply");
  if (apply && process.env.ERRBY_OPERATOR_CONFIRM !== "synthetic-test-project")
    throw new Error(
      "Apply requires ERRBY_OPERATOR_CONFIRM=synthetic-test-project",
    );
  if (
    env.ERRBY_MODE !== "live" ||
    !env.CLERK_SECRET_KEY?.startsWith("sk_test_")
  )
    throw new Error(
      "Use live mode with configured Clerk development keys and a hosted synthetic test database",
    );
  const clerk = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
  const db = createAdminClient();
  // Preflight the complete manifest before the first write.
  for (const command of commands) {
    const user = await clerk.users.getUser(command.clerkUserId);
    if (user.banned || user.locked) throw new Error("An identity is disabled");
    if (command.existingUserId && user.externalId !== command.existingUserId)
      throw new Error(
        "Imported Clerk external_id must match the reviewed legacy UUID",
      );
    if (command.role === "teacher") {
      const allowed = (process.env.ERRBY_APPROVED_TEACHER_EMAILS ?? "")
        .split(",")
        .map((v) => v.trim().toLowerCase());
      if (
        !user.emailAddresses.some(
          (e) =>
            e.verification?.status === "verified" &&
            allowed.includes(e.emailAddress.toLowerCase()),
        )
      )
        throw new Error("A confirmed, allowlisted teacher account is required");
    }
    if (command.existingUserId) {
      const old = await db
        .from("profiles")
        .select("role")
        .eq("auth_user_id", command.existingUserId)
        .single();
      if (old.error || old.data.role !== command.role)
        throw new Error("Legacy profile role mismatch");
    }
  }
  let applied = 0;
  for (const command of commands) {
    if (apply) {
      // Disable the provider's direct deletion path before granting saved-data
      // access, even if the instance default has been changed accidentally.
      await clerk.users.updateUser(command.clerkUserId, {
        deleteSelfEnabled: false,
      });
      await provisionClerkAccount(db, command, env.CLERK_ISSUER_URL!);
      applied++;
    }
  }
  console.log(
    JSON.stringify({ reviewed: commands.length, applied, dryRun: !apply }),
  );
} catch {
  // Never print provider errors, user records, manifests or credentials.
  console.error(
    "Account preflight/apply failed. Check configuration, reviewed IDs, verified teacher allowlist, class and migration status. Completed entries are idempotent; rerun the same manifest after repair.",
  );
  process.exitCode = 1;
}
