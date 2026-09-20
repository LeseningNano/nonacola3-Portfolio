import { WorksList } from "@/components/admin/works-list";
import { serializeAdminWork } from "@/lib/admin-works";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorksPage() {
  const works = await db.video.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return <WorksList initialWorks={works.map(serializeAdminWork)} />;
}
