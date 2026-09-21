import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { WorkOrderEditor } from "@/components/admin/work-order-editor";
import { serializeAdminWork } from "@/lib/admin-works";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorkOrderPage() {
  const works = await db.video.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  const initialWorks = works.map(serializeAdminWork);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="作品排序" status={<span className="text-sm text-neutral-400">{initialWorks.length} 个作品</span>} />
      <WorkOrderEditor initialWorks={initialWorks} />
    </div>
  );
}
