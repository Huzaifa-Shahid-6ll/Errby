import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loginEmail, signInSchema } from "../src/lib/auth/identity";
import { manageAccount } from "../src/lib/auth/provision";
import { parseEnv } from "../src/lib/env/schema";

test("identity input rejects role/username tricks and bounds credentials", () => {
  const configured = {
    ERRBY_MODE: "live",
    SUPABASE_URL: "https://synthetic-test.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "placeholder",
    SUPABASE_SECRET_KEY: "placeholder",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_fixture",
    CLERK_SECRET_KEY: "sk_test_fixture",
    CLERK_ISSUER_URL: "https://synthetic.clerk.accounts.dev",
    ERRBY_APP_ORIGIN: "http://127.0.0.1:3100",
  };
  assert.equal(parseEnv(configured).ERRBY_MODE, "live");
  assert.throws(
    () => parseEnv({ ...configured, SUPABASE_SECRET_KEY: "" }),
    /SUPABASE_SECRET_KEY/,
  );
  assert.throws(
    () => parseEnv({ ...configured, SUPABASE_URL: "http://localhost:54321" }),
    /hosted HTTPS/,
  );
  assert.equal(loginEmail(" Teacher@Example.com "), "teacher@example.com");
  assert.equal(
    loginEmail(`learner-${"a".repeat(24)}`),
    `learner-${"a".repeat(24)}@students.errby.invalid`,
  );
  for (const value of [
    "teacher",
    "<script>",
    "learner-a",
    "learner-a@students.errby.invalid",
    "a@elsewhere.invalid",
  ])
    assert.throws(() => loginEmail(value));
  assert.equal(
    signInSchema.safeParse({ identifier: "a@b.com", password: "x".repeat(129) })
      .success,
    false,
  );
});

test("operator provisioning fails closed on unconfirmed/unapproved teacher and cross-class recovery", async () => {
  // Provider mocks only: no live Auth success or session revocation is claimed.
  const id = "00000000-0000-4000-8000-000000000001";
  const studentId = "00000000-0000-4000-8000-000000000002";
  let user = { id, email: "approved@example.com", email_confirmed_at: "" };
  let inserted: unknown;
  let mutations = 0;
  let classOwner = id;
  let membershipActive = false;
  let failMembership = false;
  let deleted = false;
  let failCleanup = false;
  let resetPassword = "";
  const db = {
    auth: {
      admin: {
        getUserById: async () => ({ data: { user }, error: null }),
        createUser: async (value: {
          email: string;
          password: string;
          email_confirm: boolean;
        }) => {
          mutations++;
          assert.match(
            value.email,
            /^learner-[a-f0-9]{24}@students\.errby\.invalid$/,
          );
          assert.equal(value.email_confirm, true);
          assert.equal(value.password.length, 32);
          return { data: { user: { id } }, error: null };
        },
        updateUserById: async (target: string, input: { password: string }) => {
          assert.equal(target, studentId);
          assert.equal(input.password.length, 32);
          resetPassword = input.password;
          mutations++;
          return { error: null };
        },
        deleteUser: async () => {
          deleted = true;
          return { error: failCleanup ? {} : null };
        },
      },
    },
    from: (table: string) => {
      const filters: Record<string, unknown> = {};
      const query = {
        select: () => query,
        eq: (name: string, value: unknown) => {
          filters[name] = value;
          return query;
        },
        single: async () => ({
          data:
            table === "profiles"
              ? {
                  role:
                    filters.auth_user_id === studentId ? "learner" : "teacher",
                }
              : table === "classes"
                ? filters.teacher_id === classOwner
                  ? { id, grade_band: "middle_school" }
                  : null
                : membershipActive
                  ? { student_id: id }
                  : null,
          error: null,
        }),
        insert: async (value: unknown) => {
          inserted = value;
          return {
            error: table === "memberships" && failMembership ? {} : null,
          };
        },
      };
      return query;
    },
  } as unknown as SupabaseClient;
  const approval = {
    operation: "approve-teacher",
    userId: id,
    alias: "Teacher A",
  };
  await assert.rejects(manageAccount(db, approval, [user.email]), /confirmed/);
  user = { ...user, email_confirmed_at: "2026-09-18" };
  await assert.rejects(manageAccount(db, approval, []), /allowlisted/);
  await manageAccount(db, approval, [user.email]);
  assert.deepEqual(inserted, {
    auth_user_id: id,
    role: "teacher",
    alias: "Teacher A",
    setup_mode: "independent",
  });
  const learner = {
    operation: "create-learner",
    teacherId: id,
    classId: id,
    alias: "Synthetic A",
  };
  classOwner = "another-teacher";
  await assert.rejects(manageAccount(db, learner, []), /owned/);
  classOwner = id;
  await assert.rejects(
    manageAccount(
      db,
      { operation: "reset-learner", teacherId: id, classId: id, userId: id },
      [],
    ),
    /learner membership/,
  );
  membershipActive = true;
  await assert.rejects(
    manageAccount(
      db,
      { operation: "reset-learner", teacherId: id, classId: id, userId: id },
      [],
    ),
    /learner membership/,
  );
  assert.equal(mutations, 0);
  user = {
    id: studentId,
    email: `learner-${"a".repeat(24)}@students.errby.invalid`,
    email_confirmed_at: "2026-09-18",
  };
  const reset = await manageAccount(
    db,
    {
      operation: "reset-learner",
      teacherId: id,
      classId: id,
      userId: studentId,
    },
    [],
  );
  assert.equal(reset.password, resetPassword);
  assert.equal(reset.userId, studentId);
  failMembership = true;
  await assert.rejects(
    manageAccount(db, learner, []),
    /incomplete account removed/,
  );
  assert.equal(deleted, true);
  failCleanup = true;
  await assert.rejects(
    manageAccount(db, learner, []),
    /operator must remove incomplete Auth account/,
  );
  failCleanup = false;
  failMembership = false;
  const created = await manageAccount(db, learner, []);
  assert.match(created.username!, /^learner-[a-f0-9]{24}$/);
  assert.equal(created.password!.length, 32);
});
