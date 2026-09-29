export default function Loading() {
  return (
    <div role="status" aria-label="正在加载页面媒体" className="mx-auto max-w-[60rem] animate-pulse space-y-5 motion-reduce:animate-none">
      <div aria-hidden="true" className="space-y-2 pb-2">
        <div className="h-7 w-40 rounded-sm bg-admin-raised" />
        <div className="h-3 w-3/4 max-w-80 rounded-sm bg-admin-raised/70" />
      </div>
      {[2, 1].map((count, section) => (
        <section key={section} aria-hidden="true" className="space-y-3 rounded-lg bg-admin-panel p-2 pt-3.5">
          <div className="mx-2 h-4 w-28 rounded-sm bg-admin-raised" />
          {Array.from({ length: count }, (_, index) => (
            <article key={index} className="grid min-w-0 gap-3 rounded-md p-2 sm:grid-cols-[12.5rem_minmax(0,1fr)] sm:gap-4">
              <div className="aspect-video rounded-[3px] bg-admin-raised" />
              <div className="min-w-0 space-y-2 self-center">
                <div className="h-3 w-40 rounded-sm bg-admin-raised" />
                <div className="h-7 w-44 rounded-sm bg-admin-raised/70" />
              </div>
            </article>
          ))}
          <div className="mx-2 h-9 rounded-sm bg-admin-raised/50" />
        </section>
      ))}
    </div>
  );
}
