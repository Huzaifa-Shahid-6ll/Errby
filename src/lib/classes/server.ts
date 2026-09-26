import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";

const createSchema = z.object({
  title: z.string().trim().min(1).max(160),
  grade_band: z.enum(["primary", "middle_school", "high_school"]),
});
const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Fa-f0-9]{24}$/),
});
const hash = (code: string) =>
  createHash("sha256").update(code.toUpperCase()).digest("hex");
const failure = (status: number, error_code: string, user_message: string) =>
  Response.json(
    { error_code, user_message },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function classRequest(
  request: Request,
  action: "create" | "rotate" | "preview" | "join",
  classId?: string,
) {
  const target = new URL(request.url);
  const origin = request.headers.get("origin");
  if (
    !origin ||
    origin !== target.origin ||
    request.headers.get("host") !== target.host
  )
    return failure(403, "forbidden_origin", "Submit this request from Errby.");
  if (env.ERRBY_MODE !== "live")
    return failure(
      503,
      "live_setup_required",
      "Class management requires live hosted setup and a signed-in account.",
    );
  const identity = await getIdentity();
  if (!identity) return failure(401, "unauthenticated", "Sign in to continue.");
  const role =
    action === "create" || action === "rotate" ? "teacher" : "learner";
  if (identity.profile.role !== role)
    return failure(
      403,
      "forbidden",
      "This action is unavailable for your account.",
    );
  if (action === "rotate" && !z.uuid().safeParse(classId).success)
    return failure(400, "invalid_request", "Choose a valid class.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return failure(400, "invalid_request", "Submit JSON form data.");
  if (Number(request.headers.get("content-length")) > 1024)
    return failure(413, "too_large", "Class request is too large.");
  let body: unknown;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("empty");
    timer = setTimeout(() => void reader.cancel().catch(() => {}), 15_000);
    let raw = "";
    let bytes = 0;
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) {
        await reader.cancel();
        return failure(413, "too_large", "Class request is too large.");
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    body = JSON.parse(raw);
    if (JSON.stringify(body).length > 1024)
      return failure(413, "too_large", "Class request is too large.");
  } catch {
    return failure(400, "invalid_request", "Check the form and try again.");
  } finally {
    if (timer) clearTimeout(timer);
  }
  const input = (
    action === "create"
      ? createSchema
      : action === "rotate"
        ? z.object({})
        : codeSchema
  ).safeParse(body);
  if (!input.success)
    return failure(
      400,
      "invalid_request",
      "Check the class details or code and try again.",
    );
  try {
    const db = createAdminClient();
    if (action === "create" || action === "rotate") {
      const code = randomBytes(12).toString("hex").toUpperCase();
      const result =
        action === "create"
          ? await db.rpc("create_class", {
              p_teacher: identity.user.id,
              p_title: (input.data as unknown as z.infer<typeof createSchema>)
                .title,
              p_grade: (input.data as unknown as z.infer<typeof createSchema>)
                .grade_band,
              p_code_hash: hash(code),
            })
          : await db.rpc("rotate_class_code", {
              p_teacher: identity.user.id,
              p_class: classId,
              p_code_hash: hash(code),
            });
      if (result.error) throw result.error;
      if (!result.data)
        return failure(404, "class_unavailable", "Class is unavailable.");
      return Response.json(
        { id: action === "create" ? result.data : classId, code },
        {
          status: action === "create" ? 201 : 200,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
    const result = await db.rpc("join_class", {
      p_learner: identity.user.id,
      p_code_hash: hash(
        (input.data as unknown as z.infer<typeof codeSchema>).code,
      ),
      p_confirm: action === "join",
    });
    if (result.error) throw result.error;
    if (result.data?.error === "rate_limited")
      return failure(
        429,
        "rate_limited",
        "Too many code attempts. Try again in 15 minutes.",
      );
    if (result.data?.error === "invalid_code")
      return failure(
        400,
        "invalid_code",
        "That class code is invalid or has been rotated.",
      );
    return Response.json(
      { class: result.data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return failure(
      503,
      "classes_unavailable",
      "Class management is unavailable. Check hosted Supabase setup and migrations, then retry.",
    );
  }
}
