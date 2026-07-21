export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-8 px-8 max-w-6xl mx-auto space-y-12 animate-pulse">
      <section className="space-y-4">
        <div className="h-6 w-32 bg-neutral-900 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-40 bg-neutral-900 rounded" />
          <div className="h-40 bg-neutral-900 rounded" />
        </div>
      </section>
      <section className="space-y-4">
        <div className="h-6 w-32 bg-neutral-900 rounded" />
        <div className="h-48 bg-neutral-900 rounded" />
      </section>
      <section className="space-y-4">
        <div className="h-6 w-32 bg-neutral-900 rounded" />
        <div className="h-40 bg-neutral-900 rounded" />
      </section>
    </div>
  );
}