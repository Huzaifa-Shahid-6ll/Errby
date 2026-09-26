import Link from "next/link";
import { SessionView } from "./session-view";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-10">
      <Link href="/learn" className="underline">
        Back to learning workspace
      </Link>
      <SessionView id={(await params).id} />
    </main>
  );
}
