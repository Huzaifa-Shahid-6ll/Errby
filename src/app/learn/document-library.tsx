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
import type { Extraction } from "@/lib/ingestion/contracts";
import type { DocumentSummary } from "@/lib/documents/contracts";
import { DropdownMenu } from "radix-ui";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { ContentLabel } from "./chat-content";

export function DocumentLibrary({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (value: { name: string; source: Extraction }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  async function load() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/documents", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.user_message ?? "Saved documents are unavailable.",
        );
      setDocuments(payload.documents);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Saved documents are unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function select(document: DocumentSummary) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.user_message ?? "This document is unavailable.",
        );
      onSelect({
        name: document.name,
        source: { ...payload.extraction, document_id: document.id },
      });
      setOpen(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "This document is unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.user_message ?? "Removal could not be confirmed.");
      }
      setDocuments((items) => items.filter((item) => item.id !== id));
      setRemoving(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Removal could not be confirmed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setRemoving(null);
        if (value) void load();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" disabled={disabled}>
          <ContentLabel kind="document">Saved documents</ContentLabel>
        </Button>
      </DialogTrigger>
      <DialogContent className="chat-document-dialog max-h-[85dvh] overflow-y-auto [&_button]:min-h-11 [&_a]:min-h-11">
        <DialogHeader>
          <DialogTitle>Your documents</DialogTitle>
          <DialogDescription>
            Private originals and extracted text. Up to 20 documents, 4 MiB
            each. Choose a document to inspect it before adding it to your
            notes.
          </DialogDescription>
        </DialogHeader>
        {busy && <p role="status">Loading…</p>}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void load()}
            >
              Retry
            </Button>
          </div>
        )}
        {!busy && !error && !documents.length && (
          <p>No saved documents yet. Attach a readable PDF or DOCX in chat.</p>
        )}
        <ul className="space-y-4">
          {documents.map((document) => (
            <li
              key={document.id}
              className="chat-content-card space-y-2"
              data-kind="document"
            >
              <p>
                <ContentLabel kind="document">{document.name}</ContentLabel>
              </p>
              <p className="text-sm text-muted-foreground">
                {document.kind.toUpperCase()} ·{" "}
                {Math.ceil(document.bytes / 1024)} KiB
                {document.state === "uploading"
                  ? " · Save not confirmed; retry later or contact support"
                  : document.state && document.state !== "ready"
                    ? " · Cleanup needed — remove to retry cleanup"
                    : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <div
                  className="inline-flex max-w-full"
                  role="group"
                  aria-label={`Open ${document.name}`}
                >
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      busy || (!!document.state && document.state !== "ready")
                    }
                    onClick={() => void select(document)}
                    className={`min-w-0 shrink whitespace-normal ${!document.state || document.state === "ready" ? "rounded-r-none" : ""}`}
                  >
                    <EyeIcon weight="duotone" aria-hidden="true" />
                    Preview document
                  </Button>
                  {(!document.state || document.state === "ready") && (
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          className="min-w-11 rounded-l-none border-l-0 px-3"
                          aria-label={`More ways to open ${document.name}`}
                        >
                          <CaretDownIcon aria-hidden="true" />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          className="chat-document-menu"
                          align="end"
                          sideOffset={6}
                          collisionPadding={12}
                        >
                          <DropdownMenu.Item asChild>
                            <a href={`/api/documents/${document.id}/file`}>
                              <DownloadSimpleIcon
                                size={20}
                                weight="duotone"
                                aria-hidden="true"
                              />
                              Download original
                            </a>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setRemoving(document.id)}
                >
                  Remove original
                </Button>
              </div>
              {removing === document.id && (
                <div className="space-y-2 rounded border p-3">
                  <p>
                    Remove this saved original? Excerpts already used in saved
                    conversations remain with those conversations.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void remove(document.id)}
                  >
                    Confirm removal
                  </Button>{" "}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setRemoving(null)}
                  >
                    Keep document
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
