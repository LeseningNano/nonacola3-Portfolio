import { NewsList } from "@/components/admin/news-list";
import { serializeAdminPost } from "@/lib/admin-news";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const posts = await db.post.findMany({ orderBy: { createdAt: "desc" } });

  return <NewsList initialPosts={posts.map(serializeAdminPost)} />;
}
