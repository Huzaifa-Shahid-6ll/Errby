import "server-only";
import { createSessionClient } from "@/lib/db/server";
import { profileSchema } from "./identity";

// Verify against Auth; cookie contents and user_metadata must not grant a role.
export async function getIdentity() {
  const db = await createSessionClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return null;
  const result = await db
    .from("profiles")
    .select("auth_user_id,role,alias,grade_band")
    .eq("auth_user_id", data.user.id)
    .single();
  const profile = profileSchema.safeParse(result.data);
  if (result.error || !profile.success) return null;
  return { db, user: data.user, profile: profile.data };
}

export async function requireUser(role?: "learner" | "teacher") {
  const identity = await getIdentity();
  if (!identity || (role && identity.profile.role !== role))
    throw new Error("Access denied");
  return identity;
}
