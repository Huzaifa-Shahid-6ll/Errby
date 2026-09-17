import type { NextConfig } from "next";
import { parseEnv } from "./src/lib/env/schema";

parseEnv(process.env);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Avoid detecting unrelated applications above this standalone repository.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
