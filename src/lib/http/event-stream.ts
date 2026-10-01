// Both OpenRouter and the application use data-only server-sent events.
export async function* readEvents(
  body: ReadableStream<Uint8Array>,
  requireDone = false,
  maximum = 250_000,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  const reader = body.getReader();
  const stop = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", stop, { once: true });
  const decoder = new TextDecoder();
  let buffer = "";
  let data: string[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      signal?.throwIfAborted();
      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });
      if (buffer.length > maximum) throw new Error("Stream event is too large");
      let end: number;
      while ((end = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, end).replace(/\r$/, "");
        buffer = buffer.slice(end + 1);
        if (!line && data.length) {
          const event = data.join("\n");
          data = [];
          if (event === "[DONE]") return;
          yield JSON.parse(event);
        } else if (line.startsWith("data:")) {
          data.push(line.slice(5).replace(/^ /, ""));
          if (data.join("\n").length > maximum)
            throw new Error("Stream event is too large");
        }
      }
      if (done) {
        if (requireDone || buffer.trim() || data.length)
          throw new Error("Incomplete stream event");
        return;
      }
    }
  } finally {
    signal?.removeEventListener("abort", stop);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export type ProgressEvent =
  { type: "status"; message: string } | { type: "delta"; text: string };

export async function readReply(
  response: Response,
  onProgress: (event: ProgressEvent) => void,
) {
  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.user_message ?? "Please try again.");
    return payload;
  }
  if (!response.ok || !response.body) throw new Error("Reply unavailable");
  // Saved-session results include the transcript, not just the latest reply.
  for await (const event of readEvents(response.body, false, 8_000_000)) {
    if (event.type === "error") throw new Error(event.user_message);
    if (event.type === "result") return event.value;
    if (event.type === "status" || event.type === "delta") onProgress(event);
  }
  throw new Error(
    "The reply couldn't be confirmed. Your draft is still here. Retry the same message to recover it.",
  );
}
