import type { ReactNode } from "react";
import { BookOpenIcon } from "@phosphor-icons/react/dist/ssr/BookOpen";
import { QuotesIcon } from "@phosphor-icons/react/dist/ssr/Quotes";
import { LinkIcon } from "@phosphor-icons/react/dist/ssr/Link";
import { FileTextIcon } from "@phosphor-icons/react/dist/ssr/FileText";
import { ShieldIcon } from "@phosphor-icons/react/dist/ssr/Shield";
import { WrenchIcon } from "@phosphor-icons/react/dist/ssr/Wrench";
import "./chat-content.css";

const icons = {
  note: BookOpenIcon,
  source: QuotesIcon,
  document: FileTextIcon,
  guidance: ShieldIcon,
  tool: WrenchIcon,
};

export function ContentLabel({
  kind,
  children,
}: {
  kind: keyof typeof icons;
  children: ReactNode;
}) {
  const Icon = icons[kind];
  return (
    <span className="chat-content-label" data-kind={kind}>
      <Icon weight="duotone" size={20} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

// Only link explicit web addresses. Text is never interpreted as HTML or evidence.
export function MessageText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(/https?:\/\/[^\s<>"']+/gi)) {
    const raw = match[0];
    let address = raw.replace(/[.,;:!?]+$/, "");
    // Keep balanced URL parentheses, but leave sentence/Markdown closers as text.
    let extraClosers = address.split(")").length - address.split("(").length;
    while (address.endsWith(")") && extraClosers > 0) {
      address = address.slice(0, -1);
      extraClosers--;
    }
    try {
      const url = new URL(address);
      if (!url.hostname || url.username || url.password) continue;
    } catch {
      continue;
    }
    parts.push(text.slice(cursor, match.index));
    parts.push(
      <a
        key={match.index}
        href={address}
        className="chat-web-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <LinkIcon weight="duotone" size={16} aria-hidden="true" />
        {address}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>,
    );
    cursor = match.index + address.length;
  }
  parts.push(text.slice(cursor));
  return <p className="chat-message-text">{parts}</p>;
}
