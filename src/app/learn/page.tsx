import Link from "next/link";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { ChatEntry, NewChat } from "./chat-entry";
import { SessionView } from "./sessions/[id]/session-view";
import { z } from "zod";
import "./chat-workspace.css";
import { ThemeToggle } from "@/components/landing/landing-controls";

export const metadata = {
  title: "Errby · Teach me something",
  description: "Learn by explaining an idea to Errby.",
};
export const dynamic = "force-dynamic";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; new?: string }>;
}) {
  const { session, new: resetKey } = await searchParams;
  const sessionId = z.uuid().safeParse(session);
  const identity = env.ERRBY_MODE === "live" ? await getIdentity() : null;
  const saved = identity
    ? await identity.db
        .from("sessions")
        .select(
          "id,opened_at,lesson_versions!inner(lessons!lesson_versions_lesson_id_fkey!inner(title))",
        )
        .eq("learner_id", identity.user.id)
        .eq("visibility", "private")
        .order("opened_at", { ascending: false })
        .limit(20)
    : null;
  const history = (saved?.data ?? []) as unknown as {
    id: string;
    lesson_versions: { lessons: { title: string } };
  }[];
  return (
    <div className="chat-workspace">
      <a className="skip-link" href="#chat-main">
        Skip to chat
      </a>
      <aside className="chat-sidebar">
        <Link className="chat-brand" href="/learn">
          errby<span>.</span>
        </Link>
        <NewChat accountId={identity?.user.id ?? "demo"} />
        <nav aria-label="Your conversations">
          <h2>Recent chats</h2>
          {saved?.error ? (
            <p role="status">
              Saved chats could not be loaded. Refresh to retry.
            </p>
          ) : history.length ? (
            history.map((item) => (
              <Link
                key={item.id}
                href={`/learn?session=${item.id}`}
                aria-current={session === item.id ? "page" : undefined}
              >
                {item.lesson_versions.lessons.title}
              </Link>
            ))
          ) : (
            <p>Your saved conversations will appear here.</p>
          )}
        </nav>
        <Link className="chat-account" href="/setup">
          Your account
        </Link>
      </aside>
      <main id="chat-main" className="chat-main" tabIndex={-1}>
        <header className="chat-topbar">
          <span>Learn by teaching.</span>
          <div className="chat-topbar-tools">
            <span>
              {env.ERRBY_MODE === "demo"
                ? "Fictional preview"
                : "Private conversation"}
            </span>
            <ThemeToggle />
          </div>
        </header>
        {history.length > 0 && (
          <details className="chat-mobile-history">
            <summary>Recent chats</summary>
            <nav aria-label="Saved conversations on mobile">
              {history.map((item) => (
                <Link
                  key={item.id}
                  href={`/learn?session=${item.id}`}
                  aria-current={session === item.id ? "page" : undefined}
                >
                  {item.lesson_versions.lessons.title}
                </Link>
              ))}
            </nav>
          </details>
        )}
        {env.ERRBY_MODE === "live" && !identity ? (
          <p role="alert">
            Your account could not be loaded. <Link href="/learn">Retry</Link>{" "}
            or <Link href="/sign-in">sign in</Link>.
          </p>
        ) : sessionId.success ? (
          <SessionView key={sessionId.data} id={sessionId.data} quiet />
        ) : (
          <ChatEntry
            key={`${identity?.user.id ?? "demo"}:${resetKey ?? ""}`}
            accountId={identity?.user.id ?? "demo"}
            demo={env.ERRBY_MODE === "demo"}
          />
        )}
      </main>
    </div>
  );
}
