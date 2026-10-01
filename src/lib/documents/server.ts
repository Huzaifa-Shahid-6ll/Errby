import "server-only";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { IngestionError } from "@/lib/ingestion/server";
import { handleDocumentRequest } from "./request";

export function documentRequest(
  request: Request,
  id?: string,
  action?: "file" | "sources",
) {
  return handleDocumentRequest(
    request,
    async () => {
      if (env.ERRBY_MODE !== "live")
        throw new IngestionError(
          "demo_only",
          "Personal documents are unavailable in this fictional preview.",
          503,
        );
      const identity = await getIdentity();
      if (!identity || identity.profile.role !== "learner")
        throw new IngestionError(
          "unauthenticated",
          "Sign in to access your private documents.",
          401,
        );
      return { db: createAdminClient(), owner: identity.user.id };
    },
    id,
    action,
  );
}
