import { createAdminClient } from "../src/lib/db/admin";
import { manageAccount } from "../src/lib/auth/provision";

// Read the command JSON from stdin so credentials never enter shell arguments.
// Run explicitly with .env.local and react-server condition; never during tests.
try {
  if (process.env.ERRBY_OPERATOR_CONFIRM !== "synthetic-test-project")
    throw new Error(
      "Set ERRBY_OPERATOR_CONFIRM=synthetic-test-project for the configured hosted test project",
    );
  const url = new URL(process.env.SUPABASE_URL ?? "");
  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co"))
    throw new Error("Use a hosted supabase.co synthetic test project");
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 2048) throw new Error("Account command too large");
  }
  const result = await manageAccount(
    createAdminClient(),
    JSON.parse(input),
    (process.env.ERRBY_APPROVED_TEACHER_EMAILS ?? "").split(","),
  );
  // Deliberately display generated credentials once for secure teacher delivery.
  console.log(JSON.stringify(result));
} catch (error) {
  // Validation/provider payloads can contain input; do not dump them.
  console.error(
    error instanceof SyntaxError ||
      (error as { name?: string })?.name === "ZodError"
      ? "Invalid account command"
      : error instanceof Error
        ? error.message
        : "Account operation failed",
  );
  process.exitCode = 1;
}
