import Link from "next/link";
import { FileText, MessageCircle } from "lucide-react";
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
    <div className="mx-auto max-w-[48rem] space-y-4">
      <AdminPageHeader title="NEW" subtitle="新建内容" back={{ href: "/dashboard/news", label: "返回 News" }} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/news/new?type=short" className={choiceClassName}>
          <MessageCircle className="size-5 text-admin-accent" aria-hidden="true" />
          <span className="text-sm font-medium text-admin-fg">短动态</span>
          <span className="text-xs leading-5 text-admin-fg-3">快速发布一段简短内容。</span>
        </Link>
        <Link href="/dashboard/news/new?type=article" className={choiceClassName}>
          <FileText className="size-5 text-admin-accent" aria-hidden="true" />
          <span className="text-sm font-medium text-admin-fg">Markdown 文章</span>
          <span className="text-xs leading-5 text-admin-fg-3">撰写带标题和实时预览的长文。</span>
        </Link>
      </div>
    </div>
  );
}

const choiceClassName =
  "flex min-h-32 flex-col gap-2 rounded-lg bg-admin-panel p-5 outline-none transition-colors hover:bg-admin-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent";
