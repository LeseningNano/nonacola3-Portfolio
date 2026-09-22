import { redirect } from "next/navigation";

export default async function LegacyEditWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/works/${id}/edit`);
}
