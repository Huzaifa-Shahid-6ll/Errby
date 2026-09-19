import Link from "next/link";
import { SavedPreparation } from "./saved-preparation";
export default async function PreparationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-10">
      <Link href="/prepare" className="underline">
        Back to preparations
      </Link>
      <h1 className="my-6 text-3xl font-semibold">Saved preparation</h1>
      <SavedPreparation id={(await params).id} />
    </main>
  );
}
