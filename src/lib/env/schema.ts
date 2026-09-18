import { z } from "zod";

const schema = z
  .object({
    ERRBY_MODE: z.enum(["demo", "live"]).default("demo"),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
    SUPABASE_SECRET_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  })
  .superRefine((env, ctx) => {
    if (env.ERRBY_MODE === "live") {
      for (const name of [
        "SUPABASE_URL",
        "SUPABASE_PUBLISHABLE_KEY",
        "SUPABASE_SECRET_KEY",
      ] as const) {
        if (!env[name]?.trim())
          ctx.addIssue({
            code: "custom",
            path: [name],
            message: "Required in live mode",
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
