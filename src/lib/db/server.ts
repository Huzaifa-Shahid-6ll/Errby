import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env/server";

// Pages use a read-only store; proxy persists refreshed cookies before rendering.
// This uses the caller's session and RLS, never a service-role bypass.
export async function createSessionClient(writable = false) {
  if (env.ERRBY_MODE !== "live")
    throw new Error("Database is disabled in demo mode");
  const cookieStore = await cookies();
  return createServerClient(env.SUPABASE_URL!, env.SUPABASE_PUBLISHABLE_KEY!, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        if (!writable) return;
        for (const { name, value, options } of values)
          cookieStore.set(name, value, options);
      },
    },
  });
}
