"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/animate-ui/components/radix/dialog";

type HistoryPage = {
  items: { id: string; title: string; openedAt: string }[];
  nextOffset: number | null;
};

export function ConversationHistory({
  currentSession,
}: {
  currentSession?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [result, setResult] = useState<HistoryPage>({
    items: [],
    nextOffset: null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const inputId = useId();
  useEffect(() => () => controller.current?.abort(), []);

  async function load(text: string, offset = 0) {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/sessions/search?${new URLSearchParams({ q: text, offset: String(offset) })}`,
        { cache: "no-store", signal: request.signal },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Saved chats could not be loaded. Please retry.",
        );
      if (request.signal.aborted) return;
      setResult((previous) => ({
        items: offset
          ? [
              ...previous.items,
              ...data.items.filter(
                (item: HistoryPage["items"][number]) =>
                  !previous.items.some((old) => old.id === item.id),
              ),
            ]
          : data.items,
        nextOffset: data.nextOffset,
      }));
      setSearched(text);
    } catch (reason) {
      if (!request.signal.aborted)
        setError(
          reason instanceof Error
            ? reason.message
            : "Saved chats could not be loaded. Please retry.",
        );
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  }

  function changeOpen(value: boolean) {
    setOpen(value);
    if (value) {
      setResult({ items: [], nextOffset: null });
      void load(query.trim());
    } else controller.current?.abort();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11">
          <Search aria-hidden="true" />
          Search saved chats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto [&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
        <DialogHeader>
          <DialogTitle className="pr-10">Find a saved conversation</DialogTitle>
          <DialogDescription>
            Search all your private saved chats by title or message. Opening
            chats kept only in this tab are not included.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void load(query.trim());
          }}
        >
          <label htmlFor={inputId}>Find in conversations</label>
          <div className="flex gap-2">
            <Input
              id={inputId}
              type="search"
              maxLength={120}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles and messages"
              className="min-h-11"
            />
            <Button type="submit" className="min-h-11" disabled={busy}>
              Search
            </Button>
          </div>
        </form>
        {error && <p role="alert">{error}</p>}
        <p role="status" className="text-sm text-muted-foreground">
          {busy
            ? "Finding saved chats…"
            : error
              ? "Search again to retry."
              : result.items.length
                ? `${result.items.length} conversations shown${searched ? ` for “${searched}”` : ""}.`
                : "No saved conversations found."}
        </p>
        <nav
          aria-label="Matching saved conversations"
          className="grid gap-2"
          aria-busy={busy}
        >
          {result.items.map((item) => (
            <Link
              key={item.id}
              href={`/learn?session=${item.id}`}
              prefetch={false}
              onClick={() => changeOpen(false)}
              aria-current={currentSession === item.id ? "page" : undefined}
              className="min-h-11 rounded-lg border p-3 break-words hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:bg-muted"
            >
              <span>{item.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {new Date(item.openedAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </nav>
        {result.nextOffset !== null && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => void load(searched, result.nextOffset!)}
          >
            Load older chats
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
