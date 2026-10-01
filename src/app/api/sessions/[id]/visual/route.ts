import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { IngestionError } from "@/lib/ingestion/server";
import { handleSessionVisual } from "@/lib/sessions/visual";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleSessionVisual(
    request,
    async () => {
      if (env.ERRBY_MODE !== "live")
        throw new IngestionError(
          "live_setup_required",
          "Graph settings need a saved live conversation. This is a fictional preview.",
          503,
        );
      const identity = await getIdentity();
      if (!identity || identity.profile.role !== "learner")
        throw new IngestionError(
          "unauthenticated",
          "Sign in to save graph settings.",
          401,
        );
      return {
        db: createAdminClient(),
        actor: { id: identity.user.id, role: identity.profile.role },
      };
    },
    id,
  );
}
