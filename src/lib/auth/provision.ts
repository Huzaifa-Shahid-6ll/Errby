import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

const alias = z.string().trim().min(1).max(80);
const uuid = z.uuid();
export const accountCommand = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("approve-teacher"), userId: uuid, alias }),
  z.object({
    operation: z.literal("create-learner"),
    teacherId: uuid,
    classId: uuid,
    alias,
  }),
  z.object({
    operation: z.literal("reset-learner"),
    teacherId: uuid,
    classId: uuid,
    userId: uuid,
  }),
]);

// Only called by the operator CLI, never a public endpoint. The service key is
// the operator boundary; teacher/class IDs scope each assisted learner action.
export async function manageAccount(
  db: SupabaseClient,
  command: unknown,
  approvedEmails: string[],
) {
  const input = accountCommand.parse(command);
  if (input.operation === "approve-teacher") {
    const { data, error } = await db.auth.admin.getUserById(input.userId);
    const user = data.user;
    if (
      error ||
      !user?.email_confirmed_at ||
      !user.email ||
      user.email.endsWith(".invalid") ||
      !approvedEmails
        .map((email) => email.trim().toLowerCase())
        .includes(user.email.toLowerCase())
    )
      throw new Error(
        "A confirmed, allowlisted teacher Auth account is required",
      );
    const result = await db.from("profiles").insert({
      auth_user_id: user.id,
      role: "teacher",
      alias: input.alias,
      setup_mode: "independent",
    });
    if (result.error)
      throw new Error(
        "Teacher profile could not be created; existing roles are never overwritten",
      );
    return { userId: user.id, role: "teacher" };
  }
  const teacher = await db
    .from("profiles")
    .select("role")
    .eq("auth_user_id", input.teacherId)
    .single();
  const classroom = await db
    .from("classes")
    .select("id,grade_band")
    .eq("id", input.classId)
    .eq("teacher_id", input.teacherId)
    .eq("active", true)
    .single();
  if (
    teacher.error ||
    teacher.data?.role !== "teacher" ||
    classroom.error ||
    !classroom.data
  )
    throw new Error("Active class owned by the approved teacher required");
  const password = randomBytes(24).toString("base64url");
  if (input.operation === "reset-learner") {
    const membership = await db
      .from("memberships")
      .select("student_id")
      .eq("class_id", input.classId)
      .eq("student_id", input.userId)
      .eq("status", "active")
      .single();
    const profile = await db
      .from("profiles")
      .select("role")
      .eq("auth_user_id", input.userId)
      .single();
    const auth = await db.auth.admin.getUserById(input.userId);
    if (
      membership.error ||
      !membership.data ||
      profile.data?.role !== "learner" ||
      auth.error ||
      !/^learner-[a-f0-9]{24}@students\.errby\.invalid$/.test(
        auth.data.user?.email ?? "",
      )
    )
      throw new Error(
        "Active learner membership and internal account required",
      );
    // Updating the provider password never reads the old password.
    const result = await db.auth.admin.updateUserById(input.userId, {
      password,
    });
    if (result.error) throw new Error("Password reset failed");
    return { userId: input.userId, password };
  }
  const username = `learner-${randomBytes(12).toString("hex")}`;
  const created = await db.auth.admin.createUser({
    email: `${username}@students.errby.invalid`,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user)
    throw new Error("Learner Auth creation failed");
  const userId = created.data.user.id;
  try {
    const profile = await db.from("profiles").insert({
      auth_user_id: userId,
      role: "learner",
      alias: input.alias,
      grade_band: classroom.data.grade_band,
      setup_mode: "assisted",
    });
    if (profile.error) throw new Error("Learner profile creation failed");
    const membership = await db.from("memberships").insert({
      class_id: input.classId,
      student_id: userId,
      alias_in_class: input.alias,
    });
    if (membership.error) throw new Error("Learner membership creation failed");
  } catch {
    const cleanup = await db.auth.admin.deleteUser(userId);
    if (cleanup.error)
      throw new Error(
        `Provisioning failed; operator must remove incomplete Auth account ${userId}`,
      );
    throw new Error("Provisioning failed; incomplete account removed");
  }
  return { userId, username, password };
}
