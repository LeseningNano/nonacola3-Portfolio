export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="flex gap-3">
          <div className="h-4 w-20 bg-neutral-900 rounded" />
          <div className="h-4 w-16 bg-neutral-900 rounded" />
        </div>
        <div className="h-9 bg-neutral-900 rounded mt-4 w-4/5" />
        <div className="h-4 bg-neutral-900 rounded mt-8 w-full" />
        <div className="h-4 bg-neutral-900 rounded mt-2 w-full" />
        <div className="h-4 bg-neutral-900 rounded mt-2 w-2/3" />
      </div>
    </div>
  );
}