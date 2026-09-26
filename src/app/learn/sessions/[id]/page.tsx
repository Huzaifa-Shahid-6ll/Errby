import Link from "next/link";
import { SessionView } from "./session-view";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-10">
      <Link href="/learn" className="underline">
        Back to learning workspace
      </Link>
      <SessionView key={id} id={id} />
    </main>
  );
}
