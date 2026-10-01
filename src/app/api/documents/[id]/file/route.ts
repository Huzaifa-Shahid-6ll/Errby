import { documentRequest } from "@/lib/documents/server";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return documentRequest(request, (await context.params).id, "file");
}
