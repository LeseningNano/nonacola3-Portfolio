import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// 允许 <video> 直接嵌入播放（用于幕后解析展示片段等）
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "video", "source"],
  attributes: {
    ...defaultSchema.attributes,
    video: ["controls", "src", "width", "height", " poster", "muted", "loop", "playsInline"],
    source: ["src", "type"],
    img: ["src", "alt", "title", "width", "height", "loading"],
  },
};

export function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="text-neutral-300 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          h1: (p) => <h1 className="text-2xl font-bold text-white mt-8 mb-4" {...p} />,
          h2: (p) => <h2 className="text-xl font-bold text-white mt-8 mb-3" {...p} />,
          h3: (p) => <h3 className="text-lg font-semibold text-white mt-6 mb-2" {...p} />,
          p: (p) => <p className="mb-4" {...p} />,
          a: (p) => <a className="text-white underline underline-offset-4 hover:text-neutral-300" target="_blank" rel="noopener noreferrer" {...p} />,
          ul: (p) => <ul className="list-disc list-inside mb-4 space-y-1" {...p} />,
          ol: (p) => <ol className="list-decimal list-inside mb-4 space-y-1" {...p} />,
          blockquote: (p) => <blockquote className="border-l-2 border-neutral-600 pl-4 my-4 text-neutral-400" {...p} />,
          code: ({ className, children, ...p }) => (
            <code className={`bg-neutral-800 px-1.5 py-0.5 text-sm ${className ?? ""}`} {...p}>
              {children}
            </code>
          ),
          pre: (p) => <pre className="bg-neutral-900 border border-neutral-800 p-4 overflow-x-auto my-4 text-sm" {...p} />,
          hr: () => <hr className="border-neutral-800 my-8" />,
          img: (p) => <img className="max-w-full my-4" {...p} alt={p.alt ?? ""} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
