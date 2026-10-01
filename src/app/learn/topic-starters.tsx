"use client";

import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { ContentLabel } from "./chat-content";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/animate-ui/components/radix/dialog";
import {
  topicNotes,
  topicSources,
  type TopicNotes,
} from "@/lib/chat/topic-sources";

export function TopicStarters({
  onSelect,
  disabled = false,
}: {
  onSelect: (notes: TopicNotes) => void;
  disabled?: boolean;
}) {
  return (
    <section aria-label="Topics with reference notes" className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Need reference notes? Try one of these topics.
      </p>
      <div className="flex flex-wrap gap-2">
        {topicSources.map((source) => (
          <Dialog key={source.id}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={disabled}
              >
                <ContentLabel kind="note">{source.title}</ContentLabel>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85dvh] overflow-y-auto [&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
              <DialogHeader>
                <DialogTitle className="pr-10">{source.title}</DialogTitle>
                <DialogDescription>
                  Review these notes, then add them to your draft. Nothing is
                  sent until you choose Send.
                </DialogDescription>
              </DialogHeader>
              <section
                className="chat-content-card space-y-2"
                data-kind="note"
                aria-label="Reference note"
              >
                <ContentLabel kind="note">
                  Reference note · Errby summary
                </ContentLabel>
                <p className="text-sm leading-relaxed">{source.notes}</p>
              </section>
              <figure
                className="chat-content-card space-y-2"
                data-kind="source"
              >
                <figcaption>
                  <ContentLabel kind="source">Source excerpt</ContentLabel>
                </figcaption>
                <blockquote className="text-sm">“{source.quote}”</blockquote>
              </figure>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="chat-resource-link text-sm"
              >
                <ArrowSquareOutIcon
                  size={20}
                  weight="duotone"
                  aria-hidden="true"
                />
                <span>
                  Read {source.publisher}: {source.sourceTitle} (opens in a new
                  tab)
                </span>
              </a>
              <p className="text-xs text-muted-foreground">
                {source.section} · Source checked {source.checkedAt}.{" "}
                {source.sourceNote} Notes are an Errby summary; generated
                practice still needs evidence checks.
              </p>
              <DialogClose asChild>
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={disabled}
                  onClick={() => onSelect(topicNotes(source))}
                >
                  Use these reference notes
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </section>
  );
}
