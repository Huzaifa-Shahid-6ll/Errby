import "server-only";
import { IngestionError } from "@/lib/ingestion/server";
import type { ProgressEvent } from "./event-stream";

export function streamResponse(
  work: (
    emit: (event: ProgressEvent) => void,
    signal: AbortSignal,
  ) => Promise<unknown>,
  requestSignal?: AbortSignal,
) {
  let connected = true;
  const cancellation = new AbortController();
  const signal = AbortSignal.any([
    cancellation.signal,
    ...(requestSignal ? [requestSignal] : []),
  ]);
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
          emit({ type: "result", value: await work(emit, signal) });
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
      // Workers choose safe cancellation boundaries; committed database work is retained.
      cancel() {
        connected = false;
        cancellation.abort();
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
