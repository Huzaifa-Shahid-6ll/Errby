import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { IngestionError } from "@/lib/ingestion/server";
import { handleSessionHelp } from "@/lib/sessions/help";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleSessionHelp(
    request,
    async () => {
      if (env.ERRBY_MODE !== "live")
        throw new IngestionError(
          "demo_only",
          "Simpler wording needs live AI. This is a fictional preview.",
          503,
        );
      const identity = await getIdentity();
      if (!identity || identity.profile.role !== "learner")
        throw new IngestionError(
          "unauthenticated",
          "Sign in to continue.",
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
