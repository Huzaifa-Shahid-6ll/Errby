import { z } from "zod";

const schema = z
  .object({
    ERRBY_MODE: z.enum(["demo", "live"]).default("demo"),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
    SUPABASE_SECRET_KEY: z.string().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
    CLERK_SECRET_KEY: z.string().optional(),
    CLERK_ISSUER_URL: z.string().optional(),
    ERRBY_APP_ORIGIN: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  })
  .superRefine((env, ctx) => {
    if (env.ERRBY_MODE === "live") {
      for (const name of [
        "SUPABASE_URL",
        "SUPABASE_PUBLISHABLE_KEY",
        "SUPABASE_SECRET_KEY",
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
        "CLERK_ISSUER_URL",
        "ERRBY_APP_ORIGIN",
      ] as const) {
        if (!env[name]?.trim())
          ctx.addIssue({
            code: "custom",
            path: [name],
            message: "Required in live mode",
          });
      }
      for (const name of ["CLERK_ISSUER_URL", "ERRBY_APP_ORIGIN"] as const) {
        const value = env[name];
        if (!value) continue;
        try {
          const url = new URL(value);
          if (
            url.origin !== value ||
            (url.protocol !== "https:" &&
              !(
                name === "ERRBY_APP_ORIGIN" &&
                url.protocol === "http:" &&
                ["localhost", "127.0.0.1"].includes(url.hostname)
              ))
          )
            throw new Error();
        } catch {
          ctx.addIssue({
            code: "custom",
            path: [name],
            message:
              "Use an exact HTTPS origin (HTTP loopback allowed for the local app)",
          });
        }
      }
      const publishable = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      const secret = env.CLERK_SECRET_KEY;
      if (
        publishable &&
        secret &&
        (!/^pk_(test|live)_/.test(publishable) ||
          !/^sk_(test|live)_/.test(secret) ||
          publishable.split("_")[1] !== secret.split("_")[1])
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["CLERK_SECRET_KEY"],
          message: "Use matching Clerk development or production keys",
        });
      }
      if (
        env.SUPABASE_URL &&
        !z
          .url({ protocol: /^https$/, hostname: /^[a-z0-9-]+\.supabase\.co$/ })
          .safeParse(env.SUPABASE_URL).success
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["SUPABASE_URL"],
          message: "Must be a hosted HTTPS Supabase test-project URL",
        });
      }
    }
  });

export function parseEnv(input: Record<string, string | undefined>) {
  const result = schema.safeParse(input);
  if (!result.success) {
    // Report names and reasons only; never print environment values.
    throw new Error(
      `Invalid environment: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
    );
  }
  return result.data;
}
