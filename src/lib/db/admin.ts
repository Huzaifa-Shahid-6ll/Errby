import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env/server";

export function createAdminClient() {
  if (env.ERRBY_MODE !== "live" || !env.SUPABASE_SECRET_KEY)
    throw new Error("Privileged Auth configuration unavailable");
  return createClient(env.SUPABASE_URL!, env.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
