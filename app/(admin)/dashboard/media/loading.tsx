import { AdminMediaSkeleton } from "@/components/admin/admin-media-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="space-y-2">
          <div className="h-6 w-24 rounded bg-white/[0.08]" />
          <div className="h-3 w-48 rounded bg-white/[0.05]" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-lg bg-white/[0.06]" />
          <div className="h-8 w-20 rounded-lg bg-white/[0.06]" />
        </div>
      </div>
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
        <div className="h-8 w-full rounded-lg bg-white/[0.06] sm:w-48" />
      </div>
      <AdminMediaSkeleton />
    </div>
  );
}
