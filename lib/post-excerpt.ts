// 首页 news. 宽屏摘要：把文章的 Markdown 正文压成一行纯文本。
// 只做展示用的粗略去格式，不追求完整的 Markdown 解析。
export const POST_EXCERPT_LENGTH = 120;

export function getPostExcerpt(body: string, max = POST_EXCERPT_LENGTH): string {
  const text = body
    .replace(/```[\s\S]*?```/g, " ") // 代码块整段去掉
    .replace(/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/gm, " ") // 分隔线 --- / *** / ___
    .replace(/<[^>]+>/g, " ") // 内嵌 HTML 标签
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 链接只留文字
    .replace(/`([^`]*)`/g, "$1") // 行内代码
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "") // 标题、引用、列表标记
    .replace(/(\*\*|__|~~|\*|_)/g, "") // 强调符号
    .replace(/\s+/g, " ")
    .trim();

  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
