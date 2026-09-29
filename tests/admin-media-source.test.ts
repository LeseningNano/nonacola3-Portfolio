import assert from "node:assert/strict";
import test from "node:test";
import { describeMediaSource } from "../lib/admin-media-source";
import { formatMediaDuration } from "../components/admin/media-field";

const blob = "https://kq4mwotlyfyzycmp.public.blob.vercel-storage.com/uploads";

test("empty and whitespace values are unset", () => {
  assert.deepEqual(describeMediaSource(""), { kind: "empty", name: "未设置", detail: "" });
  assert.equal(describeMediaSource("   ").kind, "empty");
});

test("library files are recognised by host and extension, keeping the readable filename", () => {
  assert.deepEqual(describeMediaSource(`${blob}/work-image-1788-numb.webp`), { kind: "library-image", name: "work-image-1788-numb.webp", detail: "媒体库" });
  assert.equal(describeMediaSource(`${blob}/hero-720p.mp4?download=1`).kind, "library-video");
  assert.equal(describeMediaSource(`${blob}/hero-720p.mp4?download=1`).name, "hero-720p.mp4");
  assert.equal(describeMediaSource(`${blob}/notes.pdf`).kind, "library-file");
  assert.equal(describeMediaSource(`${blob}/%E5%B0%81%E9%9D%A2.png`).name, "封面.png");
});

test("Bilibili links, player URLs and pasted iframe code are all Bilibili", () => {
  const expected = { kind: "bilibili", name: "Bilibili · BV1Vz8E6WEd6", detail: "嵌入链接" };
  assert.deepEqual(describeMediaSource("https://www.bilibili.com/video/BV1Vz8E6WEd6/"), expected);
  assert.deepEqual(describeMediaSource("//player.bilibili.com/player.html?bvid=BV1Vz8E6WEd6&page=1"), expected);
  assert.deepEqual(describeMediaSource('<iframe src="//player.bilibili.com/player.html?bvid=BV1Vz8E6WEd6" allowfullscreen></iframe>'), expected);
  assert.equal(describeMediaSource("https://b23.tv/abc123").kind, "bilibili");
});

test("YouTube watch, short and embed links expose the video id", () => {
  for (const url of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ"]) {
    assert.deepEqual(describeMediaSource(url), { kind: "youtube", name: "YouTube · dQw4w9WgXcQ", detail: "嵌入链接" });
  }
});

test("site-relative files, other hosts and unparseable text never throw", () => {
  assert.deepEqual(describeMediaSource("/hero-poster.webp"), { kind: "local", name: "hero-poster.webp", detail: "站内文件" });
  assert.deepEqual(describeMediaSource("https://vimeo.com/123"), { kind: "external", name: "vimeo.com", detail: "外部链接" });
  assert.deepEqual(describeMediaSource("not a url"), { kind: "external", name: "not a url", detail: "外部链接" });
});

test("video durations render as mm:ss and hide unknown values", () => {
  assert.equal(formatMediaDuration(53), "00:53");
  assert.equal(formatMediaDuration(125.4), "02:05");
  assert.equal(formatMediaDuration(Number.NaN), "");
});
