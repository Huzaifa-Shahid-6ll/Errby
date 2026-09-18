import { z } from "zod";

export const usernameSchema = z.string().regex(/^learner-[a-f0-9]{24}$/);
export const profileSchema = z.object({
  auth_user_id: z.uuid(),
  role: z.enum(["learner", "teacher"]),
  alias: z.string().trim().min(1).max(80),
  grade_band: z.enum(["primary", "middle_school", "high_school"]).nullable(),
});

export function loginEmail(identifier: string) {
  const value = identifier.trim().toLowerCase();
  if (usernameSchema.safeParse(value).success)
    return `${value}@students.errby.invalid`;
  // Internal addresses are never accepted as teacher email input.
  if (
    value.endsWith(".invalid") ||
    !z.email().max(254).safeParse(value).success
  )
    throw new Error("Use your student username or teacher email.");
  return value;
}

export const signInSchema = z.object({
  identifier: z.string().min(1).max(254),
  password: z.string().min(1).max(128),
});
