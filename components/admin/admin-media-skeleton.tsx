export function AdminMediaSkeleton() {
  return (
    <div role="status" aria-label="正在加载媒体库" aria-live="polite" className="grid animate-pulse grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-3 motion-reduce:animate-none">
      {Array.from({ length: 6 }, (_, index) => (
        <article key={index} aria-hidden="true" className="min-w-0 overflow-hidden rounded-lg bg-admin-panel">
          <div className="aspect-video bg-admin-raised" />
          <div className="space-y-2 p-2.5">
            <div className="flex justify-between gap-2">
              <div className="h-3 w-3/5 rounded-sm bg-admin-raised" />
              <div className="h-3 w-10 rounded-sm bg-admin-raised/70" />
            </div>
            <div className="h-3 w-2/5 rounded-sm bg-admin-raised/70" />
          </div>
        </article>
      ))}
    </div>
  );
}
