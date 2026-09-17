import "server-only";
import { z } from "zod";

export const pastedTextSchema = z.string().trim().min(1).max(30_000);

// Foundation boundary only: no remote fetch or file parser is registered yet.
// PDF (10 MB / 50 pages), DOCX and URL/transcript fallback are next product work.
export function acceptPastedText(text: unknown) {
  return {
    text: pastedTextSchema.parse(text),
    provenance: "user_supplied_unreviewed" as const,
  };
}
