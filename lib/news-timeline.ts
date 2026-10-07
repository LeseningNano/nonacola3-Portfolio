// 首页 news. 时间轴的数据整理：截取条数、日期与年份标记、文章摘要。
import { getPostExcerpt } from "@/lib/post-excerpt";
import type { PostItem } from "@/lib/types";

export const HOME_NEWS_LIMIT = 4;

export type NewsTimelineEntry = {
  id: string;
  kind: "article" | "short";
  // 年份只在第一条和跨年处显示，其余为 null
  year: string | null;
  date: string;
  tag: string | null;
  title: string | null;
  // 文章：正文摘要；短动态：正文本身
  text: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function buildNewsTimeline(posts: PostItem[], limit = HOME_NEWS_LIMIT): NewsTimelineEntry[] {
  let previousYear: string | null = null;
  return posts.slice(0, limit).map((post) => {
    const created = new Date(post.createdAt);
    const year = String(created.getFullYear());
    const showYear = year !== previousYear;
    previousYear = year;
    const isArticle = post.title !== null;
    return {
      id: post.id,
      kind: isArticle ? "article" : "short",
      year: showYear ? year : null,
      date: `${pad(created.getMonth() + 1)}.${pad(created.getDate())}`,
      tag: post.tag,
      title: post.title,
      text: isArticle ? getPostExcerpt(post.body) : post.body,
    };
  });
}
