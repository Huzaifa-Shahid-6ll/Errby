import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { handlePreparation } from "@/lib/ingestion/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handlePreparation(request, env.ERRBY_MODE, async () => {
    const identity = await getIdentity();
    return identity ? { grade: identity.profile.grade_band ?? "" } : null;
  });
}
