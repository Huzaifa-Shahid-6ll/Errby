import { z } from "zod";

const lineSchema = z.strictObject({
  slope: z.number().min(-5).max(5),
  intercept: z.number().min(-10).max(10),
});

export const visualParametersSchema = lineSchema.extend({
  title: z.string().trim().min(1).max(100),
  caption: z.string().trim().min(1).max(240),
  comparison: lineSchema.nullable(),
});

export const visualSchema = visualParametersSchema.extend({
  version: z.literal(1),
  kind: z.literal("linear_graph"),
  id: z.uuid(),
  revision: z.number().int().min(0).max(1_000_000),
});

export type LinearVisual = z.infer<typeof visualSchema>;

export function linearValue(slope: number, intercept: number, x: number) {
  return slope * x + intercept;
}

export function wantsVisual(message: string, current?: LinearVisual) {
  return (
    Boolean(current) ||
    /\b(graph|plot|visuali[sz](?:e|ation)|diagram|slope)\b|\by\s*=/i.test(
      message,
    )
  );
}
