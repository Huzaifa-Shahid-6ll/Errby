import { sessionRequest } from "@/lib/sessions/server";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return sessionRequest(request, (await context.params).id);
}
