import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env/server";

export async function proxy(request: NextRequest) {
  if (env.ERRBY_MODE !== "live") return NextResponse.next();
  let response = NextResponse.next({ request });
  const db = createServerClient(
    env.SUPABASE_URL!,
    env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values, headers) => {
          for (const { name, value } of values)
            request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values)
            response.cookies.set(name, value, options);
          for (const [name, value] of Object.entries(headers))
            response.headers.set(name, value);
        },
      },
    },
  );
  // This refreshes the cookie only. Protected reads reverify Auth and profile.
  await db.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/", "/setup/:path*"] };
