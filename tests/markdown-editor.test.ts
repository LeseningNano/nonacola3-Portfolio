import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createUploadPlaceholder,
  getBlockInsertion,
  pickPastedImages,
  replaceUploadPlaceholder,
} from "../lib/markdown-editor";
import { MarkdownBody } from "../components/markdown-body";

const editorSource = readFileSync(new URL("../components/markdown-editor.tsx", import.meta.url), "utf8");

// 5. 图片 / 视频要单独成段：前后都留空行，不能贴在当前这行文字后面
test("block insertion pads a blank line on both sides when the cursor is mid-text", () => {
  const value = "第一段文字后面";
  const { text, cursor } = getBlockInsertion(value, 4, 4, "![图](a.png)");
  assert.equal(text, "\n\n![图](a.png)\n\n");
  assert.equal(cursor, 4 + text.length);
});

test("block insertion reuses existing blank lines instead of stacking more", () => {
  assert.equal(getBlockInsertion("段落\n\n", 4, 4, "![图](a.png)").text, "![图](a.png)\n\n");
  assert.equal(getBlockInsertion("段落\n", 3, 3, "X").text, "\nX\n\n");
  assert.equal(getBlockInsertion("", 0, 0, "X").text, "X\n\n");
  assert.equal(getBlockInsertion("A\n\nB", 1, 1, "X").text, "\n\nX");
  assert.equal(getBlockInsertion("A\n\nB", 2, 2, "X").text, "\nX\n");
});

// 6. 粘贴 / 拖入图片：只接受能上传的图片类型
test("pasted files are filtered to uploadable images", () => {
  const files = [
    { type: "image/png", name: "a.png" },
    { type: "text/plain", name: "b.txt" },
    { type: "image/webp", name: "c.webp" },
    { type: "image/svg+xml", name: "d.svg" },
    { type: "video/mp4", name: "e.mp4" },
  ];
  assert.deepEqual(pickPastedImages(files).map((file) => file.name), ["a.png", "c.webp"]);
});

test("upload placeholders are unique and swapped for the final image markdown", () => {
  const a = createUploadPlaceholder("截图.png");
  const b = createUploadPlaceholder("截图.png");
  assert.notEqual(a.token, b.token);
  assert.match(a.markdown, /^!\[上传中：截图\.png…\]\(uploading:/);

  const value = `前文\n\n${a.markdown}\n\n后文`;
  assert.equal(
    replaceUploadPlaceholder(value, a.token, "![截图](https://blob.example/x.png)"),
    "前文\n\n![截图](https://blob.example/x.png)\n\n后文"
  );
  // 上传失败：占位连同后面的空行一起移除
  assert.equal(replaceUploadPlaceholder(value, a.token, null), "前文\n\n后文");
  // 用户已经手动删掉占位：保持原样
  assert.equal(replaceUploadPlaceholder("前文", a.token, "x"), "前文");
});

// 4. <video poster> 不能被白名单过滤掉
test("article videos keep their poster attribute", () => {
  const markup = renderToStaticMarkup(
    createElement(MarkdownBody, { content: '<video controls src="https://e.com/v.mp4" poster="https://e.com/p.jpg"></video>' })
  );
  assert.match(markup, /<video[^>]*poster="https:\/\/e\.com\/p\.jpg"/);
});

// 1. 图片 / 视频从媒体库选择（含上传），不再在编辑器里单独上传
test("editor picks images and videos from the media library dialog", () => {
  assert.match(editorSource, /MediaPickerDialog/);
  assert.match(editorSource, />\s*媒体库\s*</);
  assert.doesNotMatch(editorSource, /upload\(pathname/, "no editor-local upload path");
});

// 2. 工具栏插入走浏览器原生编辑，Ctrl+Z 能撤销
test("toolbar edits go through the native insertText command so undo works", () => {
  assert.match(editorSource, /execCommand\("insertText"/);
});

// 3. 预览模式下点工具栏：先切回编辑再执行，并恢复之前的光标位置
test("toolbar actions in preview switch back to the editor before running", () => {
  assert.match(editorSource, /pendingActionRef/);
  assert.match(editorSource, /lastSelectionRef/);
});

// 6. 粘贴与拖放
test("editor uploads pasted and dropped images", () => {
  assert.match(editorSource, /onPaste=/);
  assert.match(editorSource, /onDrop=/);
  assert.match(editorSource, /uploadMediaFile/);
});
