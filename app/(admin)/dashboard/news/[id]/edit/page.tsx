import { notFound } from "next/navigation";
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

  return isShortUpdate ? <ShortPostEditor initialPost={initialPost} /> : <ArticleEditor initialPost={initialPost} />;
}
