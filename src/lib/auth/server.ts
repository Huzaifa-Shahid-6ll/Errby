import "server-only";
import { createSessionClient } from "@/lib/db/server";

// Verify against Auth; cookie contents and user_metadata must not grant a role.
export async function requireUser() {
  const db = await createSessionClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Authentication required");
  return { db, user: data.user };
}
