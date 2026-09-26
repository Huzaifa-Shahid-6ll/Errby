import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";

export const runtime = "nodejs";

const reply = (status: number, error_code: string, user_message: string) =>
  Response.json(
    { error_code, user_message },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  if (
    request.headers.get("origin") !== url.origin ||
    request.headers.get("host") !== url.host
  )
    return reply(403, "forbidden_origin", "Submit this request from Errby.");
  if (env.ERRBY_MODE !== "live")
    return reply(
      503,
      "live_setup_required",
      "Account deletion requires live hosted setup.",
    );
  const identity = await getIdentity();
  if (!identity) return reply(401, "unauthenticated", "Sign in to continue.");
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
  if (identity.profile.role === "teacher") {
    const { count, error } = await identity.db
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", identity.user.id);
    if (error)
      return reply(
        503,
        "storage_unavailable",
        "Could not confirm class ownership. Try again.",
      );
    if (count)
      return reply(
        409,
        "classes_remain",
        "Remove or transfer your classes before deleting your account.",
      );
  }
  const { error } = await createAdminClient().auth.admin.deleteUser(
    identity.user.id,
  );
  if (error)
    return reply(
      503,
      "deletion_unconfirmed",
      "Deletion could not be confirmed. Your account may still be active; sign in and check before retrying.",
    );
  return Response.json(
    { status: "deleted" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
