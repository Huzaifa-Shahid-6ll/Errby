import type { NextConfig } from "next";
import { parseEnv } from "./src/lib/env/schema";
import { INGESTION_LIMITS } from "./src/lib/ingestion/contracts";

parseEnv(process.env);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Match the route envelope so Proxy does not truncate a valid 10 MiB PDF.
  experimental: {
    proxyClientMaxBodySize: INGESTION_LIMITS.bytes + 150_000,
  },
  outputFileTracingIncludes: {
    "/prepare/extract": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.mjs",
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdfjs-dist/package.json",
    ],
  },
  // Avoid detecting unrelated applications above this standalone repository.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
