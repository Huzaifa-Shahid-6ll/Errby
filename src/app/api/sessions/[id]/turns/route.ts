import { sessionRequest } from "@/lib/sessions/server";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return sessionRequest(request, (await context.params).id, true);
}
