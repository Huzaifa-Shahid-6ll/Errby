import { classRequest } from "@/lib/classes/server";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return classRequest(request, "rotate", (await params).id);
}
