import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { classResults } from "@/lib/results/service";

export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const headers = { "Cache-Control": "private, no-store" };
  if (env.ERRBY_MODE !== "live")
    return Response.json(
      { error_code: "live_setup_required" },
      { status: 503, headers },
    );
  const identity = await getIdentity();
  if (!identity)
    return Response.json(
      { error_code: "unauthenticated" },
      { status: 401, headers },
    );
  if (identity.profile.role !== "teacher")
    return Response.json({ error_code: "forbidden" }, { status: 403, headers });
  try {
    const versionId = new URL(request.url).searchParams.get("version") ?? "";
    return Response.json(
      await classResults(
        createAdminClient(),
        identity.user.id,
        (await context.params).id,
        versionId,
      ),
      { headers },
    );
  } catch {
    return Response.json(
      { error_code: "results_unavailable" },
      { status: 404, headers },
    );
  }
}
