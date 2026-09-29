import Link from "next/link";
import { FileText, MessageSquareText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ArticleEditor } from "@/components/admin/article-editor";
import { ShortPostEditor } from "@/components/admin/short-post-editor";

export default async function NewNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { type } = await searchParams;

  if (type === "short") {
    return <ShortPostEditor />;
  }

  if (type === "article") {
    return <ArticleEditor />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="NEW" subtitle="新建内容" back={{ href: "/dashboard/news", label: "返回 News" }} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/news/new?type=short" className={choiceClassName}>
          <MessageSquareText className="size-5" aria-hidden="true" />
          <span className="font-medium text-white">短动态</span>
          <span className="text-sm text-neutral-400">快速发布一段简短内容。</span>
        </Link>
        <Link href="/dashboard/news/new?type=article" className={choiceClassName}>
          <FileText className="size-5" aria-hidden="true" />
          <span className="font-medium text-white">Markdown 文章</span>
          <span className="text-sm text-neutral-400">撰写带标题和实时预览的长文。</span>
        </Link>
      </div>
    </div>
  );
}

const choiceClassName =
  "flex min-h-36 flex-col gap-2 rounded-xl border border-white/10 bg-neutral-950/40 p-5 outline-none transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
