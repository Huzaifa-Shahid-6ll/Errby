import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env/server";

// Supabase verifies Clerk through Third-Party Auth. This client retains RLS.
export function createSessionClient(token: string) {
  if (env.ERRBY_MODE !== "live" || !token)
    throw new Error("Authenticated database configuration unavailable");
  return createClient(env.SUPABASE_URL!, env.SUPABASE_PUBLISHABLE_KEY!, {
    accessToken: async () => token,
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
