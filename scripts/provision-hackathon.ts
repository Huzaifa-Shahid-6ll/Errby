import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { manageAccount } from "../src/lib/auth/provision";

assert.equal(process.env.ERRBY_OPERATOR_CONFIRM, "synthetic-test-project");
assert(
  !existsSync(".env.hackathon"),
  "Credential file already exists; reuse existing synthetic accounts",
);
const url = process.env.SUPABASE_URL!;
assert(new URL(url).hostname.endsWith(".supabase.co"));
const db = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const clerkCutover = await db
  .from("clerk_identities")
  .select("user_id")
  .limit(1);
assert(
  clerkCutover.error?.code === "PGRST205",
  "Legacy provisioner is disabled after Clerk migration (or if schema state cannot be confirmed)",
);
writeFileSync(
  ".env.hackathon",
  "# Synthetic hackathon accounts. Private: do not commit or share publicly.\nERRBY_OPERATOR_CONFIRM=synthetic-test-project\n",
  { flag: "wx" },
);
const save = (name: string, value: string) =>
  appendFileSync(".env.hackathon", `${name}=${JSON.stringify(value)}\n`);
try {
  const email = `synthetic-teacher-${randomBytes(8).toString("hex")}@example.test`;
  const password = randomBytes(24).toString("base64url");
  save("HACKATHON_TEACHER_EMAIL", email);
  save("HACKATHON_TEACHER_PASSWORD", password);
  const teacher = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert(
    !teacher.error && teacher.data.user,
    "Synthetic teacher creation failed",
  );
  const teacherId = teacher.data.user.id;
  save("HACKATHON_TEACHER_ID", teacherId);
  await manageAccount(
    db,
    {
      operation: "approve-teacher",
      userId: teacherId,
      alias: "Synthetic Hackathon Teacher",
    },
    [email],
  );
  const code = randomBytes(12).toString("hex").toUpperCase();
  const { createHash } = await import("node:crypto");
  const classroom = await db.rpc("create_class", {
    p_teacher: teacherId,
    p_title: "Synthetic Hackathon Class",
    p_grade: "middle_school",
    p_code_hash: createHash("sha256").update(code).digest("hex"),
  });
  assert(
    !classroom.error && typeof classroom.data === "string",
    "Synthetic class creation failed",
  );
  save("HACKATHON_CLASS_ID", classroom.data);
  save("HACKATHON_CLASS_CODE", code);
  const learner = await manageAccount(
    db,
    {
      operation: "create-learner",
      teacherId,
      classId: classroom.data,
      alias: "Synthetic Hackathon Learner",
    },
    [],
  );
  assert(
    "username" in learner &&
      learner.username &&
      "password" in learner &&
      learner.password,
  );
  save("HACKATHON_LEARNER_ID", learner.userId);
  save("HACKATHON_LEARNER_USERNAME", learner.username);
  save("HACKATHON_LEARNER_PASSWORD", learner.password);
  const otherName = `learner-${randomBytes(12).toString("hex")}`;
  const otherPassword = randomBytes(24).toString("base64url");
  save("HACKATHON_OTHER_USERNAME", otherName);
  save("HACKATHON_OTHER_PASSWORD", otherPassword);
  const other = await db.auth.admin.createUser({
    email: `${otherName}@students.errby.invalid`,
    password: otherPassword,
    email_confirm: true,
  });
  assert(!other.error && other.data.user, "Synthetic outsider creation failed");
  save("HACKATHON_OTHER_ID", other.data.user.id);
  const profile = await db.from("profiles").insert({
    auth_user_id: other.data.user.id,
    role: "learner",
    alias: "Synthetic Outside Learner",
    grade_band: "middle_school",
    setup_mode: "independent",
  });
  assert(!profile.error, "Synthetic outsider profile creation failed");
  console.log(
    "Three synthetic accounts and one class ready; credentials saved privately in .env.hackathon.",
  );
} catch {
  console.error(
    "Provisioning stopped; inspect saved account identifiers privately before retrying. No credentials logged.",
  );
  process.exitCode = 1;
}
