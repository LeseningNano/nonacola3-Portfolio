import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
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

// 图片会渲染成块级 <figure>；<p> 里不能放块级元素（浏览器会拆开段落，导致水合失败），
// 所以含图片的段落改用 <div> 承载
function containsImage(node: Element | undefined): boolean {
  return Boolean(
    node?.children.some((child) => child.type === "element" && child.tagName === "img")
  );
}

export function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="text-neutral-300 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          h1: (p) => <h1 className="text-2xl font-bold text-white mt-8 mb-4" {...withoutNode(p)} />,
          h2: (p) => <h2 className="text-xl font-bold text-white mt-8 mb-3" {...withoutNode(p)} />,
          h3: (p) => <h3 className="text-lg font-semibold text-white mt-6 mb-2" {...withoutNode(p)} />,
          p: (p) =>
            containsImage(p.node) ? (
              <div className="mb-4" {...withoutNode(p)} />
            ) : (
              <p className="mb-4" {...withoutNode(p)} />
            ),
          a: (p) => <a className="text-white underline underline-offset-4 hover:text-neutral-300" target="_blank" rel="noopener noreferrer" {...withoutNode(p)} />,
          ul: (p) => <ul className="list-disc list-inside mb-4 space-y-1" {...withoutNode(p)} />,
          ol: (p) => <ol className="list-decimal list-inside mb-4 space-y-1" {...withoutNode(p)} />,
          blockquote: (p) => <blockquote className="border-l-2 border-neutral-600 pl-4 my-4 text-neutral-400" {...withoutNode(p)} />,
          code: ({ className, children, ...p }) => (
            <code className={`bg-neutral-800 px-1.5 py-0.5 text-sm ${className ?? ""}`} {...withoutNode(p)}>
              {children}
            </code>
          ),
          pre: (p) => <pre className="bg-neutral-900 border border-neutral-800 p-4 overflow-x-auto my-4 text-sm" {...withoutNode(p)} />,
          hr: () => <hr className="border-neutral-800 my-8" />,
          img: ({ alt, title, ...rest }) => {
            const p = withoutNode(rest);
            return (
              <figure className="my-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="max-w-full" {...p} alt={alt ?? ""} title={title} />
                {(title ?? alt) && (
                  <figcaption className="mt-2 text-center text-sm text-neutral-500">
                    {title ?? alt}
                  </figcaption>
                )}
              </figure>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
