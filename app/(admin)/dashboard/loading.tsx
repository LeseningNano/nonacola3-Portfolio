export default function Loading() {
  return (
    <div role="status" aria-label="正在加载管理内容" className="animate-pulse space-y-5">
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="h-6 w-20 rounded bg-white/[0.08]" />
        <div className="h-8 w-24 rounded-lg bg-white/[0.06]" />
      </div>
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="h-8 w-14 rounded-lg bg-white/[0.06]" />
          <div className="h-8 w-14 rounded-lg bg-white/[0.06]" />
        </div>
        <div className="h-8 w-full rounded-lg bg-white/[0.06] sm:w-48" />
      </div>
      <ul aria-hidden="true" className="divide-y divide-white/10 border-y border-white/10">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index} className="flex min-h-16 items-center gap-3 py-3">
            <div className="aspect-video w-16 shrink-0 rounded-md bg-white/[0.08] lg:w-[4.5rem]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-2/5 max-w-48 rounded bg-white/[0.08]" />
              <div className="h-2.5 w-1/3 max-w-36 rounded bg-white/[0.05]" />
            </div>
            <div className="hidden h-5 w-12 rounded-full bg-white/[0.06] sm:block" />
            <div className="h-8 w-8 rounded-md bg-white/[0.05]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
