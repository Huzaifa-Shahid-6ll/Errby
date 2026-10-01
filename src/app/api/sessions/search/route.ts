import { getIdentity } from "@/lib/auth/server";
import { historyResponse } from "@/lib/sessions/history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return historyResponse(request, getIdentity);
}
