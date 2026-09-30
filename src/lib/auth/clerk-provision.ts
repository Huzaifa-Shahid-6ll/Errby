import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const clerkAccountCommand = z
  .object({
    clerkUserId: z.string().regex(/^user_[A-Za-z0-9]+$/),
    existingUserId: z.uuid().optional(),
    role: z.enum(["learner", "teacher"]),
    alias: z.string().trim().min(1).max(80),
    grade: z.enum(["primary", "middle_school", "high_school"]).optional(),
    classId: z.uuid().optional(),
  })
  .strict();

export async function provisionClerkAccount(
  db: SupabaseClient,
  input: z.infer<typeof clerkAccountCommand>,
  issuer: string,
) {
  const result = await db.rpc("provision_clerk_identity", {
    p_clerk_user_id: input.clerkUserId,
    p_issuer: issuer,
    p_existing_user_id: input.existingUserId ?? null,
    p_role: input.role,
    p_alias: input.alias,
    p_grade: input.grade ?? null,
    p_class_id: input.classId ?? null,
  });
  if (result.error || typeof result.data !== "string")
    throw new Error(
      "Approval/link failed. Check existing identity, role, class and migrations; no credentials were logged.",
    );
  return result.data;
}
