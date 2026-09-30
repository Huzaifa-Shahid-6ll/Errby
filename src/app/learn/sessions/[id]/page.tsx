import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/learn?session=${encodeURIComponent(id)}`);
}
