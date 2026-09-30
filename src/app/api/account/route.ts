import { env } from "@/lib/env/server";
import { getClerkSession } from "@/lib/auth/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/db/admin";
import { isSameOrigin } from "@/lib/http/origin";

export const runtime = "nodejs";

const reply = (status: number, error_code: string, user_message: string) =>
  Response.json(
    { error_code, user_message },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function DELETE(request: Request) {
  if (!isSameOrigin(request))
    return reply(403, "forbidden_origin", "Submit this request from Errby.");
  if (env.ERRBY_MODE !== "live")
    return reply(
      503,
      "live_setup_required",
      "Account deletion requires live hosted setup.",
    );
  const session = await getClerkSession();
  if (!session) return reply(401, "unauthenticated", "Sign in to continue.");
  if (!session.has({ reverification: "strict" }))
    return reply(
      403,
      "recent_sign_in_required",
      "Sign out and sign in again before deleting your account.",
    );
  if (
    request.headers.get("content-type") !== "application/json" ||
    Number(request.headers.get("content-length")) > 128
  )
    return reply(400, "invalid_request", "Confirm account deletion.");
  let body: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("empty");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128) {
        await reader.cancel();
        return reply(413, "too_large", "Confirmation is too large.");
      }
      chunks.push(value);
    }
    body = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
  } catch {
    return reply(400, "invalid_request", "Confirm account deletion.");
  }
  if (
    !body ||
    typeof body !== "object" ||
    (body as { confirmation?: unknown }).confirmation !== "DELETE"
  )
    return reply(400, "invalid_request", "Type DELETE to confirm.");
  try {
    const clerk = await clerkClient();
    // Sensitive operation: check current provider revocation, not just JWT age.
    const active = await clerk.sessions.getSession(session.sessionId);
    if (active.status !== "active" || active.userId !== session.userId)
      return reply(401, "unauthenticated", "Sign in to continue.");
    const db = createAdminClient();
    const pending = await db.rpc("begin_clerk_account_deletion", {
      p_clerk_user_id: session.userId,
      p_issuer: env.CLERK_ISSUER_URL,
    });
    if (pending.error) {
      if (pending.error.message.includes("classes_remain"))
        return reply(
          409,
          "classes_remain",
          "Ask the Errby operator to remove or transfer your classes before deleting your account.",
        );
      return reply(
        503,
        "deletion_unconfirmed",
        "Could not start deletion. Please retry.",
      );
    }
    // RLS and application access are already disabled durably. A provider
    // failure can be retried here; a later DB failure needs operator cleanup.
    await clerk.users.deleteUser(session.userId);
    if (pending.data) {
      const removed = await db
        .from("profiles")
        .delete()
        .eq("auth_user_id", pending.data);
      if (removed.error)
        return reply(
          503,
          "cleanup_pending",
          "Sign-in was deleted and learning access is disabled. Contact the operator to finish deleting saved records.",
        );
    }
  } catch {
    return reply(
      503,
      "deletion_unconfirmed",
      "Deletion is not confirmed. Learning access may be disabled. Retry or contact the operator.",
    );
  }
  return Response.json(
    { status: "deleted" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
