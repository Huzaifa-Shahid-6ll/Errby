import "server-only";
import { IngestionError } from "@/lib/ingestion/server";
import type { ProgressEvent } from "./event-stream";

export function streamResponse(
  work: (emit: (event: ProgressEvent) => void) => Promise<unknown>,
) {
  let connected = true;
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        const emit = (event: unknown) => {
          if (connected)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
            );
        };
        try {
          emit({ type: "result", value: await work(emit) });
        } catch (error) {
          emit({
            type: "error",
            user_message:
              error instanceof IngestionError
                ? error.message
                : "The reply couldn't be confirmed. Keep your draft and retry the same message.",
          });
        } finally {
          if (connected) controller.close();
        }
      },
      // Finish dispatched work and settle its reserved cost even if the reader leaves.
      cancel() {
        connected = false;
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "private, no-store, no-transform",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
