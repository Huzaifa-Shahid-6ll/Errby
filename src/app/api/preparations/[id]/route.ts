import { preparationRequest } from "@/lib/preparations/server";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return preparationRequest(request, (await context.params).id);
}
