import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMediaReferenceIndex,
  extractHttpUrls,
  findMediaReferences,
  normalizeManagedBlobUrl,
  type MediaReferenceSnapshot,
} from "../lib/admin-media";

const blob = "https://store.public.blob.vercel-storage.com/uploads/hero.mp4";

function mediaSnapshot(overrides: Partial<{
  heroUrl: string | null;
  showreelUrl: string;
  showreelType: string;
  workThumbnail: string | null;
  workDescription: string | null;
  postBody: string;
}> = {}): MediaReferenceSnapshot {
  return {
    hero: overrides.heroUrl === null ? null : { blobUrl: overrides.heroUrl ?? "" },
    showreel: {
      showreelUrl: overrides.showreelUrl ?? "",
      videoType: overrides.showreelType ?? "url",
    },
    videos: [{
      id: "work-1",
      title: "Sample work",
      thumbnail: overrides.workThumbnail ?? null,
      description: overrides.workDescription ?? null,
    }],
    posts: [{
      id: "post-1",
      title: "Sample post",
      body: overrides.postBody ?? "",
    }],
  };
}

test("managed Blob validation accepts only credential-free HTTPS Vercel Blob hosts", () => {
  assert.equal(normalizeManagedBlobUrl(blob), blob);
  assert.equal(normalizeManagedBlobUrl("http://store.public.blob.vercel-storage.com/file"), null);
  assert.equal(normalizeManagedBlobUrl("https://public.blob.vercel-storage.com.evil.test/file"), null);
  assert.equal(normalizeManagedBlobUrl("https://user:pass@store.public.blob.vercel-storage.com/file"), null);
  assert.equal(normalizeManagedBlobUrl("not a url"), null);
});

test("managed Blob normalization removes hashes but preserves query variants", () => {
  assert.equal(
    normalizeManagedBlobUrl(`${blob}?download=1#preview`),
    `${blob}?download=1`,
  );
});

test("URL extraction recognizes Markdown and HTML media URLs without prefix matching", () => {
  const other = `${blob}-old`;
  const urls = extractHttpUrls(`![hero](${blob})\n<video src="${other}"></video>`);
  assert.deepEqual(urls, [blob, other]);
});

test("reference lookup covers approved fields and ignores filename-prefix collisions", () => {
  const snapshot = mediaSnapshot({
    heroUrl: blob,
    workDescription: `![used](${blob})`,
    postBody: `<video src="${blob}-old"></video>`,
  });

  assert.deepEqual(
    findMediaReferences(blob, snapshot).map(({ kind }) => kind),
    ["hero", "work-body"],
  );
  assert.deepEqual(
    findMediaReferences(`${blob}-old`, snapshot).map(({ kind }) => kind),
    ["post-body"],
  );
});

test("uploaded Showreel and work thumbnails are indexed with stable field references", () => {
  const references = findMediaReferences(blob, mediaSnapshot({
    showreelUrl: blob,
    showreelType: "upload",
    workThumbnail: blob,
  }));

  assert.deepEqual(references, [
    { kind: "showreel", id: "singleton", label: "Showreel", field: "showreelUrl" },
    { kind: "work-thumbnail", id: "work-1", label: "Sample work", field: "thumbnail" },
  ]);
});

test("reference index keeps an explicit empty list for unused files", () => {
  const unused = "https://store.public.blob.vercel-storage.com/uploads/unused.webp";
  const index = buildMediaReferenceIndex([blob, unused], mediaSnapshot({ heroUrl: blob }));

  assert.equal(index[blob].length, 1);
  assert.deepEqual(index[unused], []);
});
