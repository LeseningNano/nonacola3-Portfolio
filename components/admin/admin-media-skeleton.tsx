export function AdminMediaSkeleton() {
  return (
    <div role="status" aria-label="正在加载媒体库" aria-live="polite" className="grid animate-pulse grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 6 }, (_, index) => (
        <article key={index} aria-hidden="true" className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="aspect-video bg-white/[0.06]" />
          <div className="space-y-3 p-3 sm:p-4">
            <div className="h-3 w-3/4 rounded bg-white/[0.08]" />
            <div className="h-2.5 w-16 rounded bg-white/[0.05]" />
            <div className="flex items-center justify-between pt-1">
              <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
              <div className="h-8 w-16 rounded-lg bg-white/[0.06]" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
