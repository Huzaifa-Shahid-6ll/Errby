import "server-only";
import { z } from "zod";
import { visualSchema } from "@/lib/visuals/schema";
import { isSameOrigin } from "@/lib/http/origin";
import { IngestionError } from "@/lib/ingestion/server";
import { boundedJson, type SessionAccess } from "./request";
import { sessionFailure, uuid } from "./service";

const inputSchema = z.strictObject({
  message_id: z.uuid(),
  visual: visualSchema,
});

export async function handleSessionVisual(
  request: Request,
  access: () => Promise<SessionAccess>,
  id: string,
) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (!isSameOrigin(request))
      throw new IngestionError(
        "forbidden_origin",
        "Save graph settings from Errby.",
        403,
      );
    const { db, actor } = await access();
    if (
      !uuid.safeParse(id).success ||
      !request.headers.get("content-type")?.startsWith("application/json")
    )
      throw new IngestionError(
        "invalid_request",
        "Open a saved conversation to save graph settings.",
        400,
      );
    const input = inputSchema.safeParse(await boundedJson(request));
    if (!input.success)
      throw new IngestionError(
        "invalid_visual",
        "These graph settings are invalid. The saved graph is unchanged.",
        400,
      );
    if (actor.role !== "learner")
      sessionFailure({ message: "session_not_found" });
    const { data, error } = await db.rpc("save_chat_visual", {
      p_learner: actor.id,
      p_session_id: id,
      p_message_id: input.data.message_id,
      p_visual: input.data.visual,
    });
    if (error) sessionFailure(error);
    return Response.json({ visual: visualSchema.parse(data) }, { headers });
  } catch (error) {
    const failure =
      error instanceof IngestionError
        ? error
        : new IngestionError(
            "session_storage_unavailable",
            "Graph settings could not be saved. Reload the conversation to check its saved state.",
            503,
          );
    return Response.json(
      { error_code: failure.code, user_message: failure.message },
      { status: failure.status, headers },
    );
  }
}
