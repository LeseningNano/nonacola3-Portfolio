"use client";

import { useRef, useState, type TextareaHTMLAttributes } from "react";
import {
  Bold, Italic, Heading2, List, Link as LinkIcon, Image as ImageIcon,
  Video, Code, Code2, Eye, EyeOff, HelpCircle,
} from "lucide-react";
import { MarkdownBody } from "./markdown-body";

interface ToolbarBtn {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  onClick: () => void;
}

export function MarkdownEditor({
  value,
  onChange,
  textareaProps,
}: {
  value: string;
  onChange: (v: string) => void;
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  function apply(wrap: [string, string], placeholder = "") {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const selected = value.slice(s, e);
    const insert = selected || placeholder;
    const next = value.slice(0, s) + wrap[0] + insert + wrap[1] + value.slice(e);
    onChange(next);
    // 还原光标到包裹内容之间
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + wrap[0].length;
      ta.setSelectionRange(pos, pos + insert.length);
    });
  }

  function insertLine(prefix: string) {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s } = ta;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + prefix.length, s + prefix.length);
    });
  }

  function insertBlock(text: string) {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const next = value.slice(0, s) + text + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + text.length, s + text.length);
    });
  }

  function promptUrl(label: string) {
    const url = window.prompt(`${label} URL：`);
    if (!url) return;
    return url;
  }

  function handleLink() {
    const url = promptUrl("链接");
    if (!url) return;
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const selected = value.slice(s, e) || "链接文字";
    const md = `[${selected}](${url})`;
    const next = value.slice(0, s) + md + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + 1 + selected.length + 2 + url.length;
      ta.setSelectionRange(s + 1, s + 1 + selected.length);
      void pos;
    });
  }

  function handleImage() {
    const url = promptUrl("图片");
    if (!url) return;
    const alt = window.prompt("图片描述（可留空）：") || "";
    insertBlock(`![${alt}](${url})\n`);
  }

  function handleVideo() {
    const url = promptUrl("视频（mp4 直链或 Blob URL）");
    if (!url) return;
    insertBlock(`\n<video controls src="${url}"></video>\n`);
  }

  function handleCodeBlock() {
    insertBlock("\n```\n代码\n```\n");
  }

  const toolbar: ToolbarBtn[] = [
    { icon: Heading2, label: "H2", title: "二级标题", onClick: () => insertLine("## ") },
    { icon: Bold, label: "B", title: "加粗 **文字**", onClick: () => apply(["**", "**"], "加粗文字") },
    { icon: Italic, label: "I", title: "斜体 *文字*", onClick: () => apply(["*", "*"], "斜体文字") },
    { icon: List, label: "•", title: "列表项 - ", onClick: () => insertLine("- ") },
    { icon: LinkIcon, label: "L", title: "链接 [文字](URL)", onClick: handleLink },
    { icon: ImageIcon, label: "🖼", title: "图片 ![描述](URL)", onClick: handleImage },
    { icon: Video, label: "▶", title: "视频 <video controls src=URL>", onClick: handleVideo },
    { icon: Code, label: "</>", title: "行内代码 `代码`", onClick: () => apply(["`", "`"], "代码") },
    { icon: Code2, label: "{ }", title: "代码块", onClick: handleCodeBlock },
  ];

  return (
    <div className="border border-neutral-700 rounded-md overflow-hidden bg-neutral-900">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-neutral-700 bg-neutral-900/80">
        {toolbar.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.title}
            onClick={b.onClick}
            className="flex items-center justify-center w-7 h-7 text-neutral-300 hover:text-white hover:bg-neutral-700/60 rounded transition-colors"
          >
            <b.icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          title="预览"
          onClick={() => setShowPreview((v) => !v)}
          className="flex items-center gap-1 px-2 h-7 text-xs text-neutral-300 hover:text-white hover:bg-neutral-700/60 rounded transition-colors"
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? "编辑" : "预览"}
        </button>
        <button
          type="button"
          title="语法速查"
          onClick={() => setShowHelp((v) => !v)}
          className="flex items-center justify-center w-7 h-7 text-neutral-400 hover:text-white hover:bg-neutral-700/60 rounded transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 编辑区 / 预览区 */}
      {showPreview ? (
        <div className="p-3 min-h-[120px] text-sm">
          {value.trim() ? (
            <MarkdownBody content={value} />
          ) : (
            <p className="text-neutral-500">尚无内容可预览。</p>
          )}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...textareaProps}
          className={`w-full bg-neutral-900 px-3 py-2 text-sm font-mono text-neutral-200 focus:outline-none focus:border-neutral-500 resize-y ${
            textareaProps?.className ?? ""
          }`}
        />
      )}

      {/* 语法速查（常驻可展开） */}
      {showHelp && (
        <div className="border-t border-neutral-700 px-3 py-2 text-xs text-neutral-400 space-y-1 font-mono bg-neutral-900/60">
          <div><span className="text-neutral-500">标题：</span>## 小标题 / ### 小节标题</div>
          <div><span className="text-neutral-500">强调：</span><b>**加粗**</b> / <i>*斜体*</i> / `行内代码`</div>
          <div><span className="text-neutral-500">列表：</span>- 项目一 / 1. 有序项</div>
          <div><span className="text-neutral-500">链接：</span>[文字](https://链接URL)</div>
          <div><span className="text-neutral-500">图片：</span>![描述](https://图片URL)</div>
          <div><span className="text-neutral-500">视频：</span>&lt;video controls src=&quot;https://视频URL.mp4&quot;&gt;&lt;/video&gt;</div>
          <div><span className="text-neutral-500">代码块：</span>``` 包裹多行代码</div>
          <div><span className="text-neutral-500">引用：</span>&gt; 引用文字</div>
          <div><span className="text-neutral-500">分隔线：</span>---</div>
        </div>
      )}
    </div>
  );
}