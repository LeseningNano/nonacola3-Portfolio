export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="aspect-video w-full bg-neutral-900 rounded" />
        <div className="h-8 bg-neutral-900 rounded mt-8 w-3/5" />
        <div className="flex gap-3 mt-4">
          <div className="h-5 w-16 bg-neutral-900 rounded" />
          <div className="h-5 w-24 bg-neutral-900 rounded" />
        </div>
        <div className="h-4 bg-neutral-900 rounded mt-6 w-full" />
        <div className="h-4 bg-neutral-900 rounded mt-2 w-4/5" />
        <div className="h-4 bg-neutral-900 rounded mt-2 w-2/3" />
      </div>
    </div>
  );
}