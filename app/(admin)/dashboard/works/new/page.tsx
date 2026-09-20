import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { WorkEditor } from "@/components/admin/work-editor";

export default function NewWorkPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="新建作品" />
      <WorkEditor mode="create" />
    </div>
  );
}
