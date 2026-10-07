// Markdown 编辑器的纯逻辑：块级插入的空行处理、粘贴图片筛选、上传占位替换。
// UI 在 components/markdown-editor.tsx，测试直接导入这里。

// 与媒体库上传（components/admin/media-picker.tsx）接受的图片类型一致
export const UPLOADABLE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// 图片、视频、代码块要单独成段：前后各留一个空行，已有的换行不重复叠加
export function getBlockInsertion(value: string, start: number, end: number, block: string) {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const leading = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trailing = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const text = `${leading}${block}${trailing}`;
  return { text, cursor: start + text.length };
}

export function pickPastedImages<T extends { type: string }>(files: Iterable<T>): T[] {
  return Array.from(files).filter((file) => UPLOADABLE_IMAGE_TYPES.includes(file.type));
}

let placeholderCount = 0;

// 上传期间先插一段占位，完成后换成真实图片；token 唯一，多张同时上传互不干扰
export function createUploadPlaceholder(fileName: string) {
  placeholderCount += 1;
  const token = `uploading:${Date.now().toString(36)}-${placeholderCount}`;
  const label = fileName.replace(/[[\]]/g, "");
  return { token, markdown: `![上传中：${label}…](${token})` };
}

// replacement 为 null 表示上传失败：连同占位后面的空行一起移除
export function replaceUploadPlaceholder(value: string, token: string, replacement: string | null) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`!\\[[^\\]]*\\]\\(${escaped}\\)${replacement === null ? "\\n{0,2}" : ""}`);
  if (!pattern.test(value)) return value;
  return value.replace(pattern, () => replacement ?? "");
}

export type LineFormat = "h2" | "h3" | "ul" | "ol" | "quote";

const HEADING = /^#{1,6} /;
const LIST = /^(?:[-*+]|\d+\.) /;
const QUOTE = /^> /;

const LINE_FORMATS: Record<LineFormat, { strip: RegExp; isOn: (line: string) => boolean; prefix: (n: number) => string }> = {
  h2: { strip: HEADING, isOn: (line) => line.startsWith("## "), prefix: () => "## " },
  h3: { strip: HEADING, isOn: (line) => line.startsWith("### "), prefix: () => "### " },
  ul: { strip: LIST, isOn: (line) => /^[-*+] /.test(line), prefix: () => "- " },
  ol: { strip: LIST, isOn: (line) => /^\d+\. /.test(line), prefix: (n) => `${n}. ` },
  quote: { strip: QUOTE, isOn: (line) => QUOTE.test(line), prefix: () => "> " },
};

// 标题 / 列表 / 引用：作用于选区覆盖的每一整行。
// 每行都已是该格式 → 取消；否则统一换成该格式（同类的其他前缀会被替换，不会叠加）。
// 多行时跳过空行；返回要替换的行范围 [from, to)、新文本和替换后的选区。
export function toggleLineFormat(value: string, start: number, end: number, kind: LineFormat) {
  const format = LINE_FORMATS[kind];
  const from = value.lastIndexOf("\n", start - 1) + 1;
  // 选区恰好停在换行符后面时，不算进下一行
  const lastPos = end > start && value[end - 1] === "\n" ? end - 1 : end;
  const lineEnd = value.indexOf("\n", lastPos);
  const to = lineEnd === -1 ? value.length : lineEnd;

  const lines = value.slice(from, to).split("\n");
  const isTarget = (line: string) => lines.length === 1 || line.trim() !== "";
  const targets = lines.filter(isTarget);
  const allOn = targets.length > 0 && targets.every(format.isOn);

  let counter = 0;
  const next = lines.map((line) => {
    if (!isTarget(line)) return line;
    const body = line.replace(format.strip, "");
    if (allOn) return body;
    counter += 1;
    return format.prefix(counter) + body;
  });
  const text = next.join("\n");

  let selection: [number, number];
  if (lines.length === 1 && start === end) {
    const oldPrefix = lines[0].length - lines[0].replace(format.strip, "").length;
    const newPrefix = next[0].length - lines[0].replace(format.strip, "").length;
    const offset = Math.max(newPrefix, start - from - oldPrefix + newPrefix);
    selection = [from + offset, from + offset];
  } else {
    selection = [from, from + text.length];
  }
  return { from, to, text, selection };
}
