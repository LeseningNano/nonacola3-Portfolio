import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { ReactNode } from "react";
import type { Element } from "hast";

// 允许 <video> 直接嵌入播放（用于幕后解析展示片段等）
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "video", "source"],
  attributes: {
    ...defaultSchema.attributes,
    video: ["controls", "src", "width", "height", "poster", "muted", "loop", "playsInline"],
    source: ["src", "type"],
    img: ["src", "alt", "title", "width", "height", "loading"],
  },
};

// react-markdown 会把 hast 节点作为 node 传给自定义组件；直接展开会在 DOM 上
// 留下 node="[object Object]"，所以先剥掉
function withoutNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

// 图片 / 视频会渲染成块级 <figure>；<p> 里不能放块级元素（浏览器会拆开段落，导致水合失败），
// 所以含图片或视频的段落改用 <div> 承载
function containsMedia(node: Element | undefined): boolean {
  return Boolean(
    node?.children.some((child) => child.type === "element" && (child.tagName === "img" || child.tagName === "video"))
  );
}

// 图组：段落里只有图片（两张及以上，中间只隔换行）→ 左右并排。
// Markdown 里两张图片之间不空行就会落在同一段；空一行则各自成段、上下排列。
function isGallery(node: Element | undefined): boolean {
  if (!node) return false;
  let images = 0;
  for (const child of node.children) {
    if (child.type === "element" && child.tagName === "img") images += 1;
    else if (child.type === "text" && child.value.trim() === "") continue;
    else if (child.type === "element" && child.tagName === "br") continue;
    else return false;
  }
  return images >= 2;
}

// 图片与视频共用的框：细边框 + 淡底色，和深色背景分开；
// 图注前的 FIG. 01 编号由 globals.css 的 .article-prose 计数器生成，没写图注时只显示编号
function MediaFigure({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className="my-10">
      <div className="flex justify-center border border-neutral-800 bg-neutral-900/40">{children}</div>
      <figcaption className="mt-3 text-[13px] leading-relaxed text-neutral-500">{caption}</figcaption>
    </figure>
  );
}

// 文章与作品说明的正文排版（文章页改版第 1 步）：
// 中文行高 1.85、靠字号与留白区分小标题、列表悬挂对齐、媒体加框编号。
// 后台的两个预览也用这里，所见即所得；媒体能否突破正文栏宽由页面容器决定，不写在这里。
// wideMedia：文章页专用，文字收窄到 38rem，图片 / 视频 / 图组放宽到 52rem（规则在 globals.css）
export function MarkdownBody({ content, wideMedia = false }: { content: string; wideMedia?: boolean }) {
  return (
    <div
      className="article-prose text-base md:text-[17px] leading-[1.85] text-neutral-300"
      data-layout={wideMedia ? "wide-media" : undefined}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          h1: (p) => <h1 className="mt-14 mb-5 text-[28px] font-normal leading-tight tracking-tight text-white first:mt-0 md:text-[32px]" {...withoutNode(p)} />,
          h2: (p) => <h2 className="mt-14 mb-4 text-2xl font-normal leading-snug tracking-tight text-white first:mt-0 md:text-[28px]" {...withoutNode(p)} />,
          h3: (p) => <h3 className="mt-10 mb-3 text-[19px] font-medium leading-snug text-white first:mt-0 md:text-xl" {...withoutNode(p)} />,
          p: (p) =>
            isGallery(p.node) ? (
              // 手机上下排，md 起两列；图组内的 figure 不再各自留上下外边距
              <div data-gallery="" className="my-10 grid items-start gap-4 md:grid-cols-2 [&>figure]:my-0" {...withoutNode(p)} />
            ) : containsMedia(p.node) ? (
              <div className="mb-[1.1em]" {...withoutNode(p)} />
            ) : (
              <p className="mb-[1.1em]" {...withoutNode(p)} />
            ),
          strong: (p) => <strong className="font-medium text-white" {...withoutNode(p)} />,
          a: (p) => <a className="text-white underline decoration-neutral-600 underline-offset-4 transition-colors hover:decoration-white" target="_blank" rel="noopener noreferrer" {...withoutNode(p)} />,
          ul: (p) => <ul className="mb-[1.1em] list-outside list-disc space-y-[0.4em] pl-5 marker:text-neutral-600" {...withoutNode(p)} />,
          ol: (p) => <ol className="mb-[1.1em] list-outside list-decimal space-y-[0.4em] pl-5 marker:text-neutral-600" {...withoutNode(p)} />,
          blockquote: (p) => <blockquote className="my-8 border-l-2 border-neutral-700 pl-5 text-neutral-400" {...withoutNode(p)} />,
          code: ({ className, children, ...p }) => (
            <code className={`bg-neutral-800 px-1.5 py-0.5 text-sm ${className ?? ""}`} {...withoutNode(p)}>
              {children}
            </code>
          ),
          pre: (p) => <pre className="my-8 overflow-x-auto border border-neutral-800 bg-neutral-900 p-4 text-sm leading-relaxed" {...withoutNode(p)} />,
          hr: () => <hr className="my-12 border-neutral-800" />,
          img: ({ alt, title, ...rest }) => (
            <MediaFigure caption={title ?? alt ?? undefined}>
              {/* 竖版截图限高 80vh，完整显示不裁切 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="block max-h-[80vh] w-auto max-w-full object-contain" {...withoutNode(rest)} alt={alt ?? ""} title={title} />
            </MediaFigure>
          ),
          video: (p) => (
            <MediaFigure>
              <video className="block max-h-[80vh] w-full" {...withoutNode(p)} />
            </MediaFigure>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
