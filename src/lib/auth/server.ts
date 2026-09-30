import "server-only";
import { createSessionClient } from "@/lib/db/server";
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
  const mapped = await db.rpc("current_app_user_id");
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
