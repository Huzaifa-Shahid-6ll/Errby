import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env/server";

// Use only from Route Handlers / Server Actions where cookie refresh can be saved.
// This uses the caller's session and RLS, never a service-role bypass.
export async function createSessionClient() {
  if (env.ERRBY_MODE !== "live")
    throw new Error("Database is disabled in demo mode");
  const cookieStore = await cookies();
  return createServerClient(env.SUPABASE_URL!, env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values)
          cookieStore.set(name, value, options);
      },
    },
  });
}
