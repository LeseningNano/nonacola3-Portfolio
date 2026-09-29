import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { WorkOrderEditor } from "@/components/admin/work-order-editor";
import { serializeAdminWork } from "@/lib/admin-works";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorkOrderPage() {
  const works = await db.video.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  const initialWorks = works.map(serializeAdminWork);

  return (
    <div className="mx-auto max-w-[60rem] space-y-4">
      <AdminPageHeader title="ORDER" subtitle="调整顺序" meta={`${initialWorks.length} 个作品`} back={{ href: "/dashboard/works", label: "返回作品" }} />
      <WorkOrderEditor initialWorks={initialWorks} />
    </div>
  );
}
