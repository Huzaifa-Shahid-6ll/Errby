import "server-only";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { IngestionError } from "@/lib/ingestion/server";
import { handleDurablePreparation } from "./request";

export function preparationRequest(request: Request, id?: string) {
  return handleDurablePreparation(
    request,
    async () => {
      if (env.ERRBY_MODE !== "live")
        throw new IngestionError(
          "live_setup_required",
          "Durable saving requires live mode, a hosted Supabase URL and keys, applied migrations, and a signed-in synthetic account. The demo extraction does not save material.",
          503,
        );
      const identity = await getIdentity();
      if (!identity)
        throw new IngestionError(
          "unauthenticated",
          "Sign in to open or save preparation material.",
          401,
        );
      return {
        db: createAdminClient(),
        actor: {
          id: identity.user.id,
          role: identity.profile.role,
          grade: identity.profile.grade_band ?? "",
        },
      };
    },
    id,
  );
}
