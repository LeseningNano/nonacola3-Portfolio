"use client";

import {
  useEffect, useRef, useState,
  type ClipboardEvent, type DragEvent, type TextareaHTMLAttributes,
} from "react";
import {
  Bold, Italic, Heading2, List, Link as LinkIcon, Image as ImageIcon,
  Video, Code, Code2, Eye, EyeOff, HelpCircle, FolderOpen, X,
} from "lucide-react";
import { MarkdownBody } from "./markdown-body";
import { useToast } from "./toast";
import { MediaPickerDialog, uploadMediaFile } from "./admin/media-picker";
import {
  createUploadPlaceholder,
  getBlockInsertion,
  pickPastedImages,
  replaceUploadPlaceholder,
} from "@/lib/markdown-editor";

type InsertKind = "link" | "image" | "video" | null;
type EditorAction = (ta: HTMLTextAreaElement) => void;

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
  const [insertKind, setInsertKind] = useState<InsertKind>(null);
  const [insertUrl, setInsertUrl] = useState("");
  const [insertText, setInsertText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const { error: toastError } = useToast();

  // 预览模式下 textarea 不在页面上：记住最后的选区，工具栏操作先切回编辑再执行
  const lastSelectionRef = useRef<[number, number]>([0, 0]);
  const pendingActionRef = useRef<EditorAction | null>(null);
  // 异步上传完成时要基于最新内容替换占位
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  function rememberSelection() {
    const ta = ref.current;
    if (ta) lastSelectionRef.current = [ta.selectionStart, ta.selectionEnd];
  }

  function runInEditor(action: EditorAction) {
    const ta = ref.current;
    if (!showPreview && ta) {
      action(ta);
      return;
    }
    pendingActionRef.current = action;
    setShowPreview(false);
  }

  useEffect(() => {
    if (showPreview) return;
    const action = pendingActionRef.current;
    const ta = ref.current;
    if (!action || !ta) return;
    pendingActionRef.current = null;
    const [start, end] = lastSelectionRef.current;
    ta.focus();
    ta.setSelectionRange(start, end);
    action(ta);
  }, [showPreview]);

  // 走浏览器原生的 insertText，编辑会进入 textarea 自己的撤销栈，Ctrl+Z 可以撤销；
  // 不支持时退回直接改值（不可撤销，但内容正确）
  function replaceRange(ta: HTMLTextAreaElement, start: number, end: number, text: string, select?: [number, number]) {
    ta.focus();
    ta.setSelectionRange(start, end);
    const inserted = typeof document.execCommand === "function" && document.execCommand("insertText", false, text);
    if (!inserted) onChange(ta.value.slice(0, start) + text + ta.value.slice(end));
    const [selStart, selEnd] = select ?? [start + text.length, start + text.length];
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
      rememberSelection();
    });
  }

  function apply(wrap: [string, string], placeholder = "") {
    runInEditor((ta) => {
      const { selectionStart: s, selectionEnd: e } = ta;
      const insert = ta.value.slice(s, e) || placeholder;
      const from = s + wrap[0].length;
      replaceRange(ta, s, e, wrap[0] + insert + wrap[1], [from, from + insert.length]);
    });
  }

  function insertLine(prefix: string) {
    runInEditor((ta) => {
      const s = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf("\n", s - 1) + 1;
      replaceRange(ta, lineStart, lineStart, prefix, [s + prefix.length, s + prefix.length]);
    });
  }

  // 图片 / 视频 / 代码块单独成段，前后自动补空行
  function insertBlock(block: string) {
    runInEditor((ta) => {
      const { selectionStart: s, selectionEnd: e } = ta;
      const { text, cursor } = getBlockInsertion(ta.value, s, e, block);
      replaceRange(ta, s, e, text, [cursor, cursor]);
    });
  }

  function openInsert(kind: Exclude<InsertKind, null>) {
    const ta = ref.current;
    const [s, e] = !showPreview && ta ? [ta.selectionStart, ta.selectionEnd] : lastSelectionRef.current;
    setInsertText(value.slice(s, e));
    setInsertUrl("");
    setInsertKind(kind);
  }

  function closeInsert() {
    setInsertKind(null);
    setInsertUrl("");
    setInsertText("");
  }

  function confirmInsert() {
    if (!insertKind) return;
    const url = insertUrl.trim();
    if (!url) return;
    if (insertKind === "link") {
      const md = `[${insertText.trim() || "链接文字"}](${url})`;
      runInEditor((ta) => replaceRange(ta, ta.selectionStart, ta.selectionEnd, md));
    } else if (insertKind === "image") {
      insertBlock(`![${insertText.trim()}](${url})`);
    } else {
      insertBlock(`<video controls src="${url}"></video>`);
    }
    closeInsert();
  }

  // 粘贴 / 拖入图片：先插占位，各自上传完成后替换成图片；失败则移除占位并提示
  function uploadImages(files: File[]) {
    const uploads = files.map((file) => ({ file, ...createUploadPlaceholder(file.name) }));
    insertBlock(uploads.map((upload) => upload.markdown).join("\n\n"));

    for (const upload of uploads) {
      void uploadMediaFile(upload.file, "image", undefined, () => {})
        .then((url) => `![](${url})`)
        .catch(() => {
          toastError(`图片上传失败：${upload.file.name}`);
          return null;
        })
        .then((replacement) => {
          const next = replaceUploadPlaceholder(valueRef.current, upload.token, replacement);
          valueRef.current = next;
          onChange(next);
        });
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const images = pickPastedImages(Array.from(event.clipboardData.files));
    if (images.length === 0) return;
    event.preventDefault();
    uploadImages(images);
  }

  function handleDragOver(event: DragEvent<HTMLTextAreaElement>) {
    if (event.dataTransfer.types.includes("Files")) event.preventDefault();
  }

  function handleDrop(event: DragEvent<HTMLTextAreaElement>) {
    const images = pickPastedImages(Array.from(event.dataTransfer.files));
    if (images.length === 0) return;
    event.preventDefault();
    uploadImages(images);
  }

  return (
    <div className="border border-admin-line-strong rounded-sm overflow-hidden bg-admin-raised">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-admin-line bg-admin-panel flex-wrap">
        <ToolbarBtn icon={Heading2} title="二级标题" onClick={() => insertLine("## ")} />
        <ToolbarBtn icon={Bold} title="加粗 **文字**" onClick={() => apply(["**", "**"], "加粗文字")} />
        <ToolbarBtn icon={Italic} title="斜体 *文字*" onClick={() => apply(["*", "*"], "斜体文字")} />
        <ToolbarBtn icon={List} title="列表项" onClick={() => insertLine("- ")} />
        <ToolbarBtn icon={LinkIcon} title="链接" onClick={() => openInsert("link")} />
        <ToolbarBtn icon={ImageIcon} title="图片（也可以直接粘贴或拖入）" onClick={() => openInsert("image")} />
        <ToolbarBtn icon={Video} title="视频" onClick={() => openInsert("video")} />
        <ToolbarBtn icon={Code} title="行内代码" onClick={() => apply(["`", "`"], "代码")} />
        <ToolbarBtn icon={Code2} title="代码块" onClick={() => insertBlock("```\n代码\n```")} />
        <div className="flex-1" />
        <button
          type="button"
          title="预览"
          onClick={() => {
            if (!showPreview) rememberSelection();
            setShowPreview((v) => !v);
          }}
          className="flex items-center gap-1 px-2 h-7 text-xs text-admin-fg-2 hover:text-white hover:bg-admin-selected rounded transition-colors"
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? "编辑" : "预览"}
        </button>
        <button
          type="button"
          title="语法速查"
          onClick={() => setShowHelp((v) => !v)}
          className="flex items-center justify-center w-7 h-7 text-admin-fg-2 hover:text-white hover:bg-admin-selected rounded transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 插入面板：链接/图片/视频 */}
      {insertKind && (
        <div className="border-b border-admin-line px-3 py-2.5 bg-admin-panel space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-admin-fg-2">
              {insertKind === "link" && "插入链接"}
              {insertKind === "image" && "插入图片"}
              {insertKind === "video" && "插入视频"}
            </span>
            <button
              type="button"
              onClick={closeInsert}
              className="text-admin-fg-3 hover:text-white"
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
              className="w-full bg-admin-raised border border-admin-line-strong rounded-sm px-2 py-1.5 text-sm text-admin-fg focus:outline-none focus:border-admin-accent"
            />
          )}
          <div className="flex gap-2">
            <input
              type="url"
              value={insertUrl}
              onChange={(e) => setInsertUrl(e.target.value)}
              placeholder={insertKind === "link" ? "粘贴 URL…" : "粘贴 URL，或从媒体库选择…"}
              className="flex-1 bg-admin-raised border border-admin-line-strong rounded-sm px-2 py-1.5 text-sm text-admin-fg focus:outline-none focus:border-admin-accent"
            />
            {(insertKind === "image" || insertKind === "video") && (
              // 从媒体库挑已上传的文件，弹窗里也能上传新文件，避免重复上传
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-admin-line-strong hover:border-admin-fg-2 text-admin-fg-2 hover:text-white rounded-sm transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                媒体库
              </button>
            )}
            <button
              type="button"
              onClick={confirmInsert}
              disabled={!insertUrl.trim()}
              className="px-3 py-1.5 text-xs bg-admin-accent text-admin-accent-fg hover:brightness-110 rounded-sm transition-colors disabled:opacity-50"
            >
              插入
            </button>
          </div>
        </div>
      )}

      {(insertKind === "image" || insertKind === "video") && (
        <MediaPickerDialog
          kind={insertKind}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          value={insertUrl}
          onSelect={(url) => {
            setInsertUrl(url);
            setPickerOpen(false);
          }}
        />
      )}

      {/* 编辑区 / 预览区 */}
      {showPreview ? (
        <div className="p-3 min-h-[120px] text-sm">
          {value.trim() ? (
            <MarkdownBody content={value} />
          ) : (
            <p className="text-admin-fg-3">尚无内容可预览。</p>
          )}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...textareaProps}
          onSelect={rememberSelection}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`w-full bg-admin-raised px-3 py-2 text-sm font-admin-mono text-admin-fg focus:outline-none resize-y ${
            textareaProps?.className ?? ""
          }`}
        />
      )}

      {/* 语法速查 */}
      {showHelp && (
        <div className="border-t border-admin-line px-3 py-2 text-xs text-admin-fg-2 space-y-1 font-admin-mono bg-admin-panel">
          <div><span className="text-admin-fg-3">标题：</span>## 小标题 / ### 小节标题</div>
          <div><span className="text-admin-fg-3">强调：</span><b>**加粗**</b> / <i>*斜体*</i> / `行内代码`</div>
          <div><span className="text-admin-fg-3">列表：</span>- 项目一 / 1. 有序项</div>
          <div><span className="text-admin-fg-3">链接：</span>[文字](https://链接URL)</div>
          <div><span className="text-admin-fg-3">图片：</span>![描述](https://图片URL)，也可以直接粘贴或拖入图片</div>
          <div><span className="text-admin-fg-3">视频：</span>&lt;video controls src=&quot;https://视频URL.mp4&quot;&gt;&lt;/video&gt;</div>
          <div><span className="text-admin-fg-3">代码块：</span>``` 包裹多行代码</div>
          <div><span className="text-admin-fg-3">引用：</span>&gt; 引用文字</div>
          <div><span className="text-admin-fg-3">分隔线：</span>---</div>
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
      className="flex items-center justify-center w-7 h-7 text-admin-fg-2 hover:text-white hover:bg-admin-selected rounded transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
