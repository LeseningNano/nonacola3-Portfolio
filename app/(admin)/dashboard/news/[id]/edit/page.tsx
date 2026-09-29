import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ArticleEditor } from "@/components/admin/article-editor";
import { ShortPostEditor } from "@/components/admin/short-post-editor";
import { serializeAdminPost } from "@/lib/admin-news";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) notFound();

  const initialPost = serializeAdminPost(post);
  const isShortUpdate = post.title === null;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="NEWS" subtitle={isShortUpdate ? "编辑短动态" : "编辑文章"} />
      {isShortUpdate ? <ShortPostEditor initialPost={initialPost} /> : <ArticleEditor initialPost={initialPost} />}
    </div>
  );
}
