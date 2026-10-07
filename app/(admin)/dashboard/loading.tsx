export default function Loading() {
  return (
    // 300ms 后才淡入：快速切换时不闪骨架屏（见 globals.css .admin-loading-delay）
    <div className="admin-loading-delay">
      <div role="status" aria-label="正在加载管理内容" className="mx-auto max-w-[75rem] animate-pulse space-y-4 motion-reduce:animate-none">
        <div aria-hidden="true" className="flex flex-wrap items-end justify-between gap-3 pb-2">
          <div className="space-y-2">
            <div className="h-7 w-28 rounded-sm bg-admin-raised" />
            <div className="h-3 w-36 rounded-sm bg-admin-raised/70" />
          </div>
          <div className="h-8 w-24 rounded-sm bg-admin-raised" />
        </div>
        <div aria-hidden="true" className="h-11 rounded-lg bg-admin-panel" />
        <ul aria-hidden="true" className="space-y-1">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index} className="flex items-center gap-3 rounded-sm p-2 lg:gap-4">
              <div className="aspect-video w-[6rem] shrink-0 rounded-[3px] bg-admin-raised sm:w-[7rem]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-2/5 max-w-60 rounded-sm bg-admin-raised" />
                <div className="h-3 w-1/3 max-w-44 rounded-sm bg-admin-raised/70" />
              </div>
              <div className="hidden h-3 w-12 rounded-sm bg-admin-raised/70 sm:block" />
              <div className="size-8 rounded-sm bg-admin-raised/70" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
