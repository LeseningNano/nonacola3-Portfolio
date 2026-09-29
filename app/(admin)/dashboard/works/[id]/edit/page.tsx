import { notFound } from "next/navigation";
import { WorkEditor } from "@/components/admin/work-editor";
import { serializeAdminWork } from "@/lib/admin-works";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await db.video.findUnique({ where: { id } });
  if (!work) notFound();

  const initialWork = serializeAdminWork(work);
  return <WorkEditor mode="edit" initialWork={initialWork} />;
}
