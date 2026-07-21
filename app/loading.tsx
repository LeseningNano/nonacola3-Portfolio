export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse" />
        <span className="text-sm text-neutral-500 tracking-widest" style={{ fontFamily: "var(--font-bitcount)" }}>
          loading.
        </span>
      </div>
    </div>
  );
}