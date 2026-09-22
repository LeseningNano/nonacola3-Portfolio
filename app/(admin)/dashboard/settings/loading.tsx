export default function Loading() {
  return (
    <div role="status" aria-label="正在加载页面媒体" className="mx-auto max-w-[60rem] animate-pulse space-y-8">
      <div aria-hidden="true" className="space-y-2 border-b border-white/10 pb-5">
        <div className="h-6 w-24 rounded bg-white/[0.08]" />
        <div className="h-3 w-3/4 max-w-96 rounded bg-white/[0.05]" />
      </div>
      {[2, 1].map((count, section) => (
        <div key={section} aria-hidden="true" className="space-y-6">
          <div className="h-5 w-28 rounded bg-white/[0.08]" />
          {Array.from({ length: count }, (_, index) => (
            <article key={index} className="grid min-w-0 gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 lg:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)] lg:gap-6">
              <div className="min-w-0 max-w-[22.5rem] space-y-2">
                <div className="h-3 w-20 rounded bg-white/[0.08]" />
                <div className="aspect-video rounded-md bg-white/[0.06]" />
              </div>
              <div className="min-w-0 space-y-3 lg:self-center">
                <div className="h-3 w-24 rounded bg-white/[0.05]" />
                <div className="h-8 w-full rounded-lg bg-white/[0.06]" />
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}
