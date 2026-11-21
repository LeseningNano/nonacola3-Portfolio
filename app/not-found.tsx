import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1
          className="text-4xl md:text-5xl font-normal tracking-tight text-white mb-4"
          style={{ fontFamily: "var(--font-bitcount)" }}
        >
          404.
        </h1>
        <p className="text-neutral-400 mb-8">找不到这个页面，可能已被移动或删除。</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center text-sm text-neutral-300 hover:text-white border border-neutral-400 hover:border-white px-5 py-2.5 transition-all duration-300"
          >
            返回首页
          </Link>
          <Link
            href="/works"
            className="inline-flex items-center justify-center text-sm text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-400 px-5 py-2.5 transition-all duration-300"
          >
            浏览作品
          </Link>
        </div>
      </div>
    </div>
  );
}
