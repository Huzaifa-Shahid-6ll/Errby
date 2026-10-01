import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const historyQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  offset: z.coerce.number().int().min(0).max(2147483627).default(0),
});

export async function searchHistory(
  db: SupabaseClient,
  ownerId: string,
  input: z.input<typeof historyQuerySchema> = {},
) {
  const { q, offset } = historyQuerySchema.parse(input);
  const owner = z.uuid().parse(ownerId);
  const { data, error } = await db.rpc("search_private_history", {
    p_owner: owner,
    p_query: q,
    p_offset: offset,
  });
  if (error) throw new Error("Saved chats could not be loaded. Please retry.");
  const rows = (data ?? []) as unknown as {
    id: string;
    opened_at: string;
    title: string;
  }[];
  return {
    items: rows.slice(0, 20).map((row) => ({
      id: row.id,
      title: row.title,
      openedAt: row.opened_at,
    })),
    nextOffset: rows.length > 20 ? offset + 20 : null,
  };
}

export async function historyResponse(
  request: Request,
  identify: () => Promise<{ db: SupabaseClient; user: { id: string } } | null>,
) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const identity = await identify();
    if (!identity)
      return Response.json(
        { error: "Sign in to find your saved chats." },
        { status: 401, headers },
      );
    const params = new URL(request.url).searchParams;
    const input = historyQuerySchema.safeParse({
      q: params.get("q") ?? "",
      offset: params.get("offset") ?? "0",
    });
    if (!input.success)
      return Response.json(
        { error: "Use a search of up to 120 characters and a valid page." },
        { status: 400, headers },
      );
    return Response.json(
      await searchHistory(identity.db, identity.user.id, input.data),
      { headers },
    );
  } catch {
    return Response.json(
      { error: "Saved chats could not be loaded. Please retry." },
      { status: 503, headers },
    );
  }
}
