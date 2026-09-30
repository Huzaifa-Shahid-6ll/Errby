import "server-only";
import { createSessionClient } from "@/lib/db/server";
import { createAdminClient } from "@/lib/db/admin";
import { env } from "@/lib/env/server";
import { profileSchema, trustedClerkClaims } from "./identity";

export async function getClerkSession() {
  if (env.ERRBY_MODE !== "live") return null;
  const { auth } = await import("@clerk/nextjs/server");
  const session = await auth({
    acceptsToken: "session_token",
    treatPendingAsSignedOut: true,
  });
  if (
    !session.isAuthenticated ||
    !trustedClerkClaims(
      session.sessionClaims,
      env.CLERK_ISSUER_URL,
      env.ERRBY_APP_ORIGIN,
    )
  )
    return null;
  return session;
}

export async function getIdentity() {
  const session = await getClerkSession();
  if (!session) return null;
  const token = await session.getToken();
  if (!token) return null;
  const db = createSessionClient(token);
  // Map verified issuer + subject to the existing UUID. Never match by email.
  let mapped = await db.rpc("current_app_user_id");
  if (!mapped.error && mapped.data === null) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(session.userId);
      // Deleted/disabled users cannot bootstrap using an unexpired old token.
      // Imported identities still need reviewed linking to their existing UUID.
      if (user.banned || user.locked || user.externalId) return null;
      if (user.deleteSelfEnabled)
        await clerk.users.updateUser(user.id, { deleteSelfEnabled: false });
      const created = await createAdminClient().rpc("ensure_student_profile", {
        p_clerk_user_id: session.userId,
        p_issuer: env.CLERK_ISSUER_URL!,
      });
      if (created.error) return null;
      // Resolve through the user's RLS client again, never a privileged read.
      mapped = await db.rpc("current_app_user_id");
    } catch {
      return null;
    }
  }
  if (mapped.error || typeof mapped.data !== "string") return null;
  const result = await db
    .from("profiles")
    .select("auth_user_id,role,alias,grade_band")
    .eq("auth_user_id", mapped.data)
    .single();
  const profile = profileSchema.safeParse(result.data);
  if (result.error || !profile.success) return null;
  return { db, user: { id: profile.data.auth_user_id }, profile: profile.data };
}

export async function requireUser(role?: "learner" | "teacher") {
  const identity = await getIdentity();
  if (!identity || (role && identity.profile.role !== role))
    throw new Error("Access denied");
  return identity;
}
