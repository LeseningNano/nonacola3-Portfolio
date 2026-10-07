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
