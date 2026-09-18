import { env } from "@/lib/env/server";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    app: "errby",
    mode: env.ERRBY_MODE,
    status: "foundation",
    integrations:
      env.ERRBY_MODE === "live" ? "configured_not_verified" : "not_connected",
  });
}
