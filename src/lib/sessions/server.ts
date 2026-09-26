import "server-only";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { IngestionError } from "@/lib/ingestion/server";
import { handleSessionApi } from "./request";

export function sessionRequest(request: Request, id?: string, turns = false) {
  return handleSessionApi(
    request,
    async () => {
      if (env.ERRBY_MODE !== "live")
        throw new IngestionError(
          "live_setup_required",
          "Learning sessions require live mode, a hosted Supabase project with all migrations applied, a signed-in learner account and a teacher-published lesson. The local demo does not open or save sessions.",
          503,
        );
      const identity = await getIdentity();
      if (!identity)
        throw new IngestionError(
          "unauthenticated",
          "Sign in with your learner account to start a session.",
          401,
        );
      return {
        db: createAdminClient(),
        actor: {
          id: identity.user.id,
          role: identity.profile.role,
        },
      };
    },
    id,
    turns,
  );
}
