import { reviewRequest } from "@/lib/lessons/review-server";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return reviewRequest(request, (await context.params).id);
}
