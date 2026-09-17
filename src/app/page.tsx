import { HomePreview } from "@/components/home-preview";
import { env } from "@/lib/env/server";

export const dynamic = "force-dynamic";

export default function Home() {
  if (env.ERRBY_MODE === "live") {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-3xl font-semibold">
          Live setup is not connected yet
        </h1>
        <p className="mt-4">
          Authentication, lesson preparation and AI evaluation are the next
          implementation steps. Use ERRBY_MODE=demo for the fictional local
          preview.
        </p>
      </main>
    );
  }
  return <HomePreview />;
}
