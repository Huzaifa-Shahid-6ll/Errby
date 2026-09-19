import { preparationRequest } from "@/lib/preparations/server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return preparationRequest(request);
}
export async function POST(request: Request) {
  return preparationRequest(request);
}
