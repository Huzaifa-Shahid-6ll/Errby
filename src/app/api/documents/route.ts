import { documentRequest } from "@/lib/documents/server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return documentRequest(request);
}
