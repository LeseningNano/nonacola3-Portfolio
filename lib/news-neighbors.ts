// 文章页结尾的上一篇 / 下一篇：只在已发布的文章（有标题）之间按时间排序，短动态和草稿不参与。
import type { PostItem } from "@/lib/types";

export type ArticleLink = { id: string; title: string };

export function getArticleNeighbors(posts: PostItem[], id: string): { older: ArticleLink | null; newer: ArticleLink | null } {
  const articles = posts
    .filter((post): post is PostItem & { title: string } => post.published && post.title !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const index = articles.findIndex((post) => post.id === id);
  if (index === -1) return { older: null, newer: null };
  const link = (post?: PostItem & { title: string }) => (post ? { id: post.id, title: post.title } : null);
  return { older: link(articles[index + 1]), newer: link(articles[index - 1]) };
}
