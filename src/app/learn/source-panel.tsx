"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/animate-ui/components/radix/dialog";
import type { SessionSource } from "@/lib/documents/contracts";
import { ContentLabel } from "./chat-content";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";

export function SourcePanel({ sessionId }: { sessionId: string }) {
  const [sources, setSources] = useState<SessionSource[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    setError("");
    setSources(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/sources`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.user_message ?? "Sources are unavailable. Try again.",
        );
      setSources(data.sources);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Sources are unavailable. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) void load();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11">
          <ContentLabel kind="source">Sources</ContentLabel>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reference evidence</DialogTitle>
          <DialogDescription>
            Exact saved excerpts behind this practice. Source matching shows
            where a claim came from; it does not prove the source is correct.
          </DialogDescription>
        </DialogHeader>
        {loading && <p role="status">Loading private sources…</p>}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <Button variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        )}
        {sources?.map((source, index) => (
          <section key={index} className="space-y-3 border-t pt-4">
            <h3>
              <ContentLabel kind="document">{source.title}</ContentLabel>
            </h3>
            {source.mode === "excerpt" && (
              <p className="text-sm text-muted-foreground">
                Pasted or edited reference notes. Original page locations are
                not claimed.
              </p>
            )}
            {source.document_id && (
              <a
                className="chat-resource-link"
                href={`/api/documents/${source.document_id}/file`}
              >
                <DownloadSimpleIcon size={20} aria-hidden="true" /> Download
                private original
              </a>
            )}
            {source.references.map((reference) => (
              <figure
                key={reference.id}
                className="chat-content-card"
                data-kind="source"
              >
                <figcaption className="mb-2 text-sm text-muted-foreground">
                  <ContentLabel kind="source">Source excerpt</ContentLabel>
                  <div>
                    {source.mode === "full" && reference.index !== null
                      ? `${source.kind === "docx" ? "Section" : "Page"} ${reference.index}`
                      : "Saved notes"}{" "}
                    ·{" "}
                    {reference.status === "source_checked"
                      ? "Matched to source; unreviewed"
                      : "Unreviewed source"}
                  </div>
                </figcaption>
                <blockquote className="whitespace-pre-wrap break-words text-sm">
                  {reference.text}
                </blockquote>
              </figure>
            ))}
            {!source.references.length && (
              <p>No supported excerpt is recorded for this source.</p>
            )}
          </section>
        ))}
        {sources?.length === 0 && <p>No reference sources are recorded.</p>}
      </DialogContent>
    </Dialog>
  );
}
