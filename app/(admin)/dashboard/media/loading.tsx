import { AdminMediaSkeleton } from "@/components/admin/admin-media-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[75rem] space-y-4">
      <div aria-hidden="true" className="flex flex-wrap items-end justify-between gap-3 pb-2">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-sm bg-admin-raised" />
          <div className="h-3 w-40 rounded-sm bg-admin-raised/70" />
        </div>
        <div className="h-8 w-20 rounded-sm bg-admin-raised" />
      </div>
      <div aria-hidden="true" className="h-11 rounded-lg bg-admin-panel" />
      <AdminMediaSkeleton />
    </div>
  );
}
