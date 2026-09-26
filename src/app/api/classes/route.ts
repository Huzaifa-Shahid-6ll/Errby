import { classRequest } from "@/lib/classes/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return classRequest(request, "create");
}
