import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import { env } from "@/lib/env/server";
import { safeDestination } from "@/lib/auth/redirect";
import { trustedClerkClaims } from "@/lib/auth/identity";

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (env.ERRBY_MODE !== "live") return NextResponse.next();
  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  const clerkProxy = clerkMiddleware(
    async (auth, request) => {
      const pathname = request.nextUrl.pathname;
      const dataRequest =
        pathname.startsWith("/api/") && pathname !== "/api/health";
      const protectedPage = /^\/learn(\/|$)/.test(pathname);
      const session = await auth({
        acceptsToken: "session_token",
        treatPendingAsSignedOut: true,
      });
      const signedIn =
        session.isAuthenticated &&
        trustedClerkClaims(
          session.sessionClaims,
          env.CLERK_ISSUER_URL,
          env.ERRBY_APP_ORIGIN,
        );
      let response = NextResponse.next();
      if (!signedIn && dataRequest) {
        response = NextResponse.json(
          {
            error_code: "unauthenticated",
            user_message: "Sign in to continue.",
          },
          { status: 401 },
        );
      } else if (!signedIn && protectedPage) {
        const destination = new URL("/sign-in", request.url);
        destination.searchParams.set(
          "next",
          safeDestination(pathname + request.nextUrl.search),
        );
        response = NextResponse.redirect(destination);
      }
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    },
    {
      authorizedParties: env.ERRBY_APP_ORIGIN ? [env.ERRBY_APP_ORIGIN] : [],
      signInUrl: "/sign-in",
      signUpUrl: "/sign-up",
    },
  );

  return clerkProxy(request, event);
}

export const config = {
  matcher: ["/((?!_next|icon.svg|favicon.ico).*)"],
};
