import { resultMutation } from "@/lib/results/request";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return resultMutation(request, (await context.params).id, "activity");
}
