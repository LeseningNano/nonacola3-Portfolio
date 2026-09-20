import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { WorkEditor } from "@/components/admin/work-editor";
import { serializeAdminWork } from "@/lib/admin-works";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await db.video.findUnique({ where: { id } });
  if (!work) notFound();

  const initialWork = serializeAdminWork(work);
  return (
    <div className="space-y-6">
      <AdminPageHeader title={`编辑：${initialWork.title}`} />
      <WorkEditor mode="edit" initialWork={initialWork} />
    </div>
  );
}
