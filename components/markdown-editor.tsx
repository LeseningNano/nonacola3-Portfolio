"use client";

import { useRef, useState, type TextareaHTMLAttributes } from "react";
import {
  Bold, Italic, Heading2, List, Link as LinkIcon, Image as ImageIcon,
  Video, Code, Code2, Eye, EyeOff, HelpCircle, Upload, X,
} from "lucide-react";
import { MarkdownBody } from "./markdown-body";
import { useToast } from "./toast";

type InsertKind = "link" | "image" | "video" | null;

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [insertKind, setInsertKind] = useState<InsertKind>(null);
  const [insertUrl, setInsertUrl] = useState("");
  const [insertText, setInsertText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { error: toastError } = useToast();

  function apply(wrap: [string, string], placeholder = "") {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const selected = value.slice(s, e);
    const insert = selected || placeholder;
    const next = value.slice(0, s) + wrap[0] + insert + wrap[1] + value.slice(e);
    onChange(next);
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

  function openInsert(kind: Exclude<InsertKind, null>) {
    const ta = ref.current;
    const selected = ta ? ta.value.slice(ta.selectionStart, ta.selectionEnd) : "";
    setInsertText(selected);
    setInsertUrl("");
    setInsertKind(kind);
  }

  function confirmInsert() {
    if (!insertKind) return;
    const url = insertUrl.trim();
    if (!url) return;
    let md = "";
    if (insertKind === "link") {
      md = `[${insertText.trim() || "链接文字"}](${url})`;
    } else if (insertKind === "image") {
      md = `![${insertText.trim()}](${url})\n`;
    } else if (insertKind === "video") {
      md = `\n<video controls src="${url}"></video>\n`;
    }
    insertBlock(md);
    setInsertKind(null);
    setInsertUrl("");
    setInsertText("");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !insertKind) return;
    const isImage = insertKind === "image";
    const isVideo = insertKind === "video";
    // 类型校验
    if (isImage && !file.type.startsWith("image/")) {
      toastError("请选择图片文件");
      return;
    }
    if (isVideo && !file.type.startsWith("video/")) {
      toastError("请选择视频文件");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
      const prefix = isImage ? "md-img" : "md-vid";
      const pathname = `uploads/${prefix}-${Date.now()}-${safeName}`;
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob-token",
        onUploadProgress: (p) => setUploadProgress(p.percentage),
      });
      setInsertUrl(blob.url);
      setUploadProgress(100);
    } catch {
      toastError("文件上传失败");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleCodeBlock() {
    insertBlock("\n```\n代码\n```\n");
  }

  return (
    <div className="border border-neutral-700 rounded-md overflow-hidden bg-neutral-900">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-neutral-700 bg-neutral-900/80 flex-wrap">
        <ToolbarBtn icon={Heading2} title="二级标题" onClick={() => insertLine("## ")} />
        <ToolbarBtn icon={Bold} title="加粗 **文字**" onClick={() => apply(["**", "**"], "加粗文字")} />
        <ToolbarBtn icon={Italic} title="斜体 *文字*" onClick={() => apply(["*", "*"], "斜体文字")} />
        <ToolbarBtn icon={List} title="列表项" onClick={() => insertLine("- ")} />
        <ToolbarBtn icon={LinkIcon} title="链接" onClick={() => openInsert("link")} />
        <ToolbarBtn icon={ImageIcon} title="图片" onClick={() => openInsert("image")} />
        <ToolbarBtn icon={Video} title="视频" onClick={() => openInsert("video")} />
        <ToolbarBtn icon={Code} title="行内代码" onClick={() => apply(["`", "`"], "代码")} />
        <ToolbarBtn icon={Code2} title="代码块" onClick={handleCodeBlock} />
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

      {/* 插入面板：链接/图片/视频 */}
      {insertKind && (
        <div className="border-b border-neutral-700 px-3 py-2.5 bg-neutral-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {insertKind === "link" && "插入链接"}
              {insertKind === "image" && "插入图片"}
              {insertKind === "video" && "插入视频"}
            </span>
            <button
              type="button"
              onClick={() => setInsertKind(null)}
              className="text-neutral-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {insertKind !== "video" && (
            <input
              type="text"
              value={insertText}
              onChange={(e) => setInsertText(e.target.value)}
              placeholder={insertKind === "link" ? "链接文字（可留空，用选中文本）" : "图片描述（可留空）"}
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500"
            />
          )}
          <div className="flex gap-2">
            <input
              type="url"
              value={insertUrl}
              onChange={(e) => setInsertUrl(e.target.value)}
              placeholder="粘贴 URL…"
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-neutral-500"
            />
            {(insertKind === "image" || insertKind === "video") && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept={insertKind === "image" ? "image/*" : "video/*"}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-neutral-600 hover:border-white text-neutral-300 hover:text-white rounded transition-colors disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? `${uploadProgress}%` : "上传文件"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={confirmInsert}
              disabled={!insertUrl.trim() || uploading}
              className="px-3 py-1.5 text-xs bg-white text-black hover:bg-neutral-200 rounded transition-colors disabled:opacity-50"
            >
              插入
            </button>
          </div>
          {uploading && (
            <div className="w-full h-1 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

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

      {/* 语法速查 */}
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

function ToolbarBtn({
  icon: Icon,
  title,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex items-center justify-center w-7 h-7 text-neutral-300 hover:text-white hover:bg-neutral-700/60 rounded transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}