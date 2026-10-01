import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { isSameOrigin } from "@/lib/http/origin";
import { IngestionError } from "@/lib/ingestion/server";
import { boundedJson } from "@/lib/sessions/request";
import { enterChat, entrySchema } from "@/lib/chat/entry";
import { streamResponse } from "@/lib/http/stream-response";

export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (!isSameOrigin(request))
      throw new IngestionError(
        "forbidden_origin",
        "Send this message from Errby.",
        403,
      );
    if (env.ERRBY_MODE !== "live")
      throw new IngestionError(
        "demo_only",
        "This is a fictional preview. Live AI and saving are unavailable in demo mode.",
        503,
      );
    const identity = await getIdentity();
    if (!identity)
      throw new IngestionError(
        "unauthenticated",
        "Sign in to chat with Errby.",
        401,
      );
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new IngestionError("invalid_request", "Send a text message.", 400);
    const parsed = entrySchema.safeParse(await boundedJson(request));
    if (!parsed.success)
      throw new IngestionError(
        "invalid_request",
        "Use a message or notes up to 8,000 characters.",
        400,
      );
    const run = (
      emit?: Parameters<typeof enterChat>[4],
      signal = request.signal,
    ) =>
      enterChat(
        createAdminClient(),
        {
          id: identity.user.id,
          role: identity.profile.role,
          grade: identity.profile.grade_band ?? "",
        },
        parsed.data,
        undefined,
        emit,
        signal,
      );
    return request.headers.get("accept")?.includes("text/event-stream")
      ? streamResponse(run, request.signal)
      : Response.json(await run(), { headers });
  } catch (error) {
    const failure =
      error instanceof IngestionError
        ? error
        : new IngestionError(
            "chat_unavailable",
            "Errby is unavailable right now. Your text is unchanged; try again.",
            503,
          );
    return Response.json(
      { error_code: failure.code, user_message: failure.message },
      { status: failure.status, headers },
    );
  }
}
