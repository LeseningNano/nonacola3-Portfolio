export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-8 max-w-3xl mx-auto animate-pulse">
      <div className="h-8 w-40 bg-neutral-900 rounded mb-6" />
      <div className="border border-neutral-800 rounded-md p-6 bg-neutral-900 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 bg-neutral-800 rounded" />
            <div className="h-10 w-full bg-neutral-800 rounded" />
          </div>
        ))}
        <div className="flex gap-4 pt-2">
          <div className="h-9 w-24 bg-neutral-800 rounded" />
          <div className="h-9 w-24 bg-neutral-800 rounded" />
        </div>
      </div>
    </div>
  );
}