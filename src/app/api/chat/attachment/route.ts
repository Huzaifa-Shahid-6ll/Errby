import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { isSameOrigin } from "@/lib/http/origin";
import { handlePreparation } from "@/lib/ingestion/request";
import { CHAT_UPLOAD_BYTES } from "@/lib/ingestion/contracts";
import { createAdminClient } from "@/lib/db/admin";
import { persistDocument } from "@/lib/documents/service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json(
      { user_message: "Upload from Errby." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  return handlePreparation(
    request,
    env.ERRBY_MODE,
    async () => {
      const identity = await getIdentity();
      return identity?.profile.role === "learner"
        ? { id: identity.user.id, grade: identity.profile.grade_band ?? "" }
        : null;
    },
    CHAT_UPLOAD_BYTES,
    (owner, file, bytes, extraction) =>
      persistDocument(createAdminClient(), owner, file, bytes, extraction),
  );
}
