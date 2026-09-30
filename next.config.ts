import type { NextConfig } from "next";
import { parseEnv } from "./src/lib/env/schema";

const env = parseEnv(process.env);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  redirects() {
    if (env.ERRBY_MODE !== "live") return [];
    const origin = new URL(env.ERRBY_APP_ORIGIN!);
    if (!["localhost", "127.0.0.1"].includes(origin.hostname)) return [];
    // Redirect before Proxy: Clerk sessions must use one browser origin.
    return [
      {
        source: "/:path((?!api/|prepare/extract|_next/).*)",
        has: [
          {
            type: "host",
            value:
              origin.hostname === "localhost" ? "127\\.0\\.0\\.1" : "localhost",
          },
        ],
        destination: `${origin.origin}/:path`,
        permanent: false,
      },
    ];
  },
  // Preserve the browser's loopback hostname for Clerk's internal rewrite;
  // Next's normalization of 127.0.0.1 to localhost otherwise proxies to itself.
  skipProxyUrlNormalize: true,
  serverExternalPackages: ["mammoth"],
  // Avoid detecting unrelated applications above this standalone repository.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
