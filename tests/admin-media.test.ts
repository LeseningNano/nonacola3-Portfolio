import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { ListBlobResult, ListBlobResultBlob } from "@vercel/blob";
import {
  buildMediaReferenceIndex,
  collectAllManagedBlobs,
  extractHttpUrls,
  findMediaReferences,
  filterMediaFiles,
  normalizeManagedBlobUrl,
  reduceMediaLibraryState,
  type MediaFile,
  type MediaReferenceSnapshot,
} from "../lib/admin-media";
import { mediaDeleteSchema } from "../lib/schemas";

const blob = "https://store.public.blob.vercel-storage.com/uploads/hero.mp4";

function listedBlob(
  url: string,
  pathname: string,
  size: number,
  uploadedAt: string,
): ListBlobResultBlob {
  return {
    url,
    downloadUrl: `${url}?download=1`,
    pathname,
    size,
    uploadedAt: new Date(uploadedAt),
    etag: `etag-${pathname}`,
  };
}

function reference(kind: "hero"): MediaFile["references"][number] {
  return { kind, id: "singleton", label: "Hero 背景视频", field: "blobUrl" };
}

function mediaFile(pathname: string, references: MediaFile["references"]): MediaFile {
  return {
    url: `https://store.public.blob.vercel-storage.com/uploads/${pathname}`,
    pathname: `uploads/${pathname}`,
    size: 1024,
    sizeMB: "0.00",
    references,
  };
}

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

test("URL extraction excludes Markdown and prose punctuation", () => {
  assert.deepEqual(
    extractHttpUrls([
      `![period](${blob}).`,
      `![comma](${blob}),`,
      `![full-stop](${blob})。`,
      `[${blob}]`,
      `(${blob})`,
      `"${blob}"`,
      `<${blob}>`,
    ].join("\n")),
    [blob, blob, blob, blob, blob, blob, blob],
  );
});

test("URL extraction recognizes case-insensitive schemes in Markdown and HTML attributes", () => {
  const uppercaseScheme = "HTTPS://store.public.blob.vercel-storage.com/uploads/hero.mp4";

  assert.deepEqual(
    extractHttpUrls([
      `[hero](${uppercaseScheme})`,
      `<a HREF='${uppercaseScheme}'>hero</a>`,
      `<video SRC="${uppercaseScheme}"></video>`,
    ].join("\n")),
    [blob, blob, blob],
  );
});

test("URL extraction ignores URLs in unsupported HTML attributes", () => {
  assert.deepEqual(
    extractHttpUrls(`<div data-backup="${blob}" aria-label="${blob}"></div>`),
    [],
  );
});

test("URL extraction preserves legitimate terminal punctuation inside structured destinations", () => {
  const markdownUrl = `${blob}?version=.`;
  const htmlUrl = `${blob}?download=!`;

  assert.deepEqual(
    extractHttpUrls(`[asset](${markdownUrl})\n<a href="${htmlUrl}">asset</a>`),
    [markdownUrl, htmlUrl],
  );
});

test("URL extraction removes every surplus closing parenthesis from enclosing contexts", () => {
  assert.deepEqual(
    extractHttpUrls(`![hero](${blob})))\n((${blob})))`),
    [blob, blob],
  );
});

test("URL extraction preserves a managed Blob URL path ending in a closing parenthesis", () => {
  const blobEndingInParenthesis = "https://store.public.blob.vercel-storage.com/uploads/(hero)";

  assert.deepEqual(
    extractHttpUrls(`![hero](${blobEndingInParenthesis})`),
    [blobEndingInParenthesis],
  );
});

test("URL extraction removes repeated enclosing parentheses from Markdown and prose", () => {
  assert.deepEqual(
    extractHttpUrls(`![hero](${blob}))\n(${blob})`),
    [blob, blob],
  );
});

test("URL extraction keeps balanced path parentheses while removing repeated enclosing delimiters", () => {
  const blobEndingInParenthesis = "https://store.public.blob.vercel-storage.com/uploads/(hero)";

  assert.deepEqual(
    extractHttpUrls(`![hero](${blobEndingInParenthesis}))`),
    [blobEndingInParenthesis],
  );
});

test("URL extraction preserves balanced parentheses in paths and queries", () => {
  const parenthesizedUrl = "https://store.public.blob.vercel-storage.com/uploads/(hero)?crop=(wide)";

  assert.deepEqual(
    extractHttpUrls(`See [asset](${parenthesizedUrl}).`),
    [parenthesizedUrl],
  );
});

test("URL extraction excludes an unmatched closing parenthesis after a bare GFM URL", () => {
  assert.deepEqual(extractHttpUrls(`${blob})`), [blob]);
});

test("URL extraction uses reference definition destinations for links and images", () => {
  const imageBlob = `${blob}?render=image`;

  assert.deepEqual(
    extractHttpUrls([
      "[download][asset]",
      "![preview][image]",
      "",
      `[asset]: ${blob}`,
      `[image]: ${imageBlob}`,
    ].join("\n")),
    [blob, imageBlob],
  );
});

test("URL extraction resolves reference definitions from nested Markdown containers", () => {
  assert.deepEqual(
    extractHttpUrls([
      "[download][asset]",
      "",
      `> [asset]: ${blob}`,
    ].join("\n")),
    [blob],
  );
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

test("reference lookup decodes escaped Markdown destination punctuation", () => {
  const escapedParenthesisBlob = "https://store.public.blob.vercel-storage.com/uploads/hero).mp4";
  const snapshot = mediaSnapshot({
    workDescription: "[asset](https://store.public.blob.vercel-storage.com/uploads/hero\\).mp4)",
  });

  assert.deepEqual(
    findMediaReferences(escapedParenthesisBlob, snapshot).map(({ kind }) => kind),
    ["work-body"],
  );
  assert.deepEqual(findMediaReferences(`${escapedParenthesisBlob}-old`, snapshot), []);
});

test("reference lookup decodes HTML and Markdown character references", () => {
  const ampersandBlob = "https://store.public.blob.vercel-storage.com/uploads/hero&final.mp4";
  const snapshot = mediaSnapshot({
    workDescription: `<video src="https://store.public.blob.vercel-storage.com/uploads/hero&amp;final.mp4"></video>`,
    postBody: [
      `<a href="https://store.public.blob.vercel-storage.com/uploads/hero&amp;final.mp4">asset</a>`,
      `[asset](https://store.public.blob.vercel-storage.com/uploads/hero&amp;final.mp4)`,
    ].join("\n"),
  });

  assert.deepEqual(
    findMediaReferences(ampersandBlob, snapshot).map(({ kind }) => kind),
    ["work-body", "post-body"],
  );
  assert.deepEqual(findMediaReferences(`${ampersandBlob}-old`, snapshot), []);
});

test("reference lookup follows HTML5 decoding for nonterminated character references", () => {
  const copyrightBlob = `${blob}?license=&copy`;
  const decodedCopyrightBlob = `${blob}?license=©`;
  const copyrightParameterBlob = `${blob}?license=&copy=2`;
  const snapshot = mediaSnapshot({
    workDescription: `[asset](${copyrightBlob})`,
    postBody: [
      `<a href="${copyrightBlob}">asset</a>`,
      `<video src="${copyrightParameterBlob}"></video>`,
    ].join("\n"),
  });

  assert.deepEqual(
    findMediaReferences(copyrightBlob, snapshot).map(({ kind }) => kind),
    ["work-body"],
  );
  assert.deepEqual(
    findMediaReferences(decodedCopyrightBlob, snapshot).map(({ kind }) => kind),
    ["post-body"],
  );
  assert.deepEqual(
    findMediaReferences(copyrightParameterBlob, snapshot).map(({ kind }) => kind),
    ["post-body"],
  );
});

test("reference lookup protects reference-style Markdown destinations", () => {
  const labelBlob = `${blob}?only=label`;
  const destinationBlob = `${blob}?actual=destination`;
  const snapshot = mediaSnapshot({
    workDescription: [
      `[${labelBlob}][download]`,
      "![preview][download]",
      "",
      `[download]: ${destinationBlob}`,
    ].join("\n"),
  });

  assert.deepEqual(findMediaReferences(labelBlob, snapshot), []);
  assert.deepEqual(
    findMediaReferences(destinationBlob, snapshot).map(({ kind }) => kind),
    ["work-body"],
  );
});

test("reference lookup finds HTML media inside direct and reference-style link labels", () => {
  const directLabelBlob = `${blob}?location=direct-label`;
  const referenceLabelBlob = `${blob}?location=reference-label`;
  const snapshot = mediaSnapshot({
    workDescription: `[<img src="${directLabelBlob}">](https://example.com/download)`,
    postBody: [
      `[<video src="${referenceLabelBlob}"></video>][download]`,
      "",
      "[download]: https://example.com/download",
    ].join("\n"),
  });

  assert.deepEqual(
    findMediaReferences(directLabelBlob, snapshot).map(({ kind }) => kind),
    ["work-body"],
  );
  assert.deepEqual(
    findMediaReferences(referenceLabelBlob, snapshot).map(({ kind }) => kind),
    ["post-body"],
  );
});

test("reference lookup excludes unmatched closing parentheses but retains balanced ones in GFM URLs", () => {
  const balancedBlob = "https://store.public.blob.vercel-storage.com/uploads/(hero)";
  const snapshot = mediaSnapshot({
    workDescription: `${blob})\n${balancedBlob}`,
  });

  assert.deepEqual(
    findMediaReferences(blob, snapshot).map(({ kind }) => kind),
    ["work-body"],
  );
  assert.deepEqual(findMediaReferences(`${blob})`, snapshot), []);
  assert.deepEqual(
    findMediaReferences(balancedBlob, snapshot).map(({ kind }) => kind),
    ["work-body"],
  );
});

test("reference lookup recognizes GFM autolinks inside Markdown styling", () => {
  const emphasizedBlob = `${blob}?style=emphasis`;
  const underscoredBlob = `${blob}?style=underscore`;
  const deletedBlob = `${blob}?style=delete`;
  const snapshot = mediaSnapshot({
    workDescription: [
      `*${emphasizedBlob}*`,
      `_${underscoredBlob}_`,
      `~~${deletedBlob}~~`,
    ].join("\n"),
  });

  for (const styledBlob of [emphasizedBlob, underscoredBlob, deletedBlob]) {
    assert.deepEqual(
      findMediaReferences(styledBlob, snapshot).map(({ kind }) => kind),
      ["work-body"],
    );
    assert.deepEqual(findMediaReferences(`${styledBlob}-old`, snapshot), []);
  }
});

test("reference lookup parses HTML attributes after quoted greater-than signs", () => {
  const snapshot = mediaSnapshot({
    postBody: `<video title="16 > 9" data-backup="${blob}-old" src="${blob}"></video>`,
  });

  assert.deepEqual(
    findMediaReferences(blob, snapshot).map(({ kind }) => kind),
    ["post-body"],
  );
  assert.deepEqual(findMediaReferences(`${blob}-old`, snapshot), []);
});

test("reference lookup trims prose punctuation but preserves it in structured URLs", () => {
  const structuredBlob = `${blob}?download=!;:`;
  const snapshot = mediaSnapshot({
    workDescription: `Download ${blob}!;:`,
    postBody: `[asset](${structuredBlob})`,
  });

  assert.deepEqual(
    findMediaReferences(blob, snapshot).map(({ kind }) => kind),
    ["work-body"],
  );
  assert.deepEqual(
    findMediaReferences(structuredBlob, snapshot).map(({ kind }) => kind),
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

test("Blob listing follows cursors until hasMore is false", async () => {
  const calls: Array<{ cursor: string | undefined; limit: number | undefined }> = [];
  const pages: ListBlobResult[] = [
    {
      blobs: [listedBlob(blob, "uploads/hero.mp4", 10, "2026-01-01")],
      cursor: "next",
      hasMore: true,
    },
    {
      blobs: [listedBlob(`${blob}-2`, "uploads/other.mp4", 20, "2026-01-02")],
      cursor: undefined,
      hasMore: false,
    },
  ];

  const result = await collectAllManagedBlobs(async (options = {}) => {
    calls.push({ cursor: options.cursor, limit: options.limit });
    return pages[calls.length - 1];
  });

  assert.deepEqual(calls, [
    { cursor: undefined, limit: 1000 },
    { cursor: "next", limit: 1000 },
  ]);
  assert.deepEqual(result.map(({ url }) => url), [blob, `${blob}-2`]);
});

test("Blob listing rejects a repeated continuation cursor", async () => {
  await assert.rejects(
    collectAllManagedBlobs(async () => ({ blobs: [], cursor: "same", hasMore: true })),
    /repeated Blob cursor/i,
  );
});

test("media deletion schema requires a valid URL and strips unknown fields", () => {
  assert.deepEqual(mediaDeleteSchema.parse({ url: blob, ignored: true }), { url: blob });
  assert.equal(mediaDeleteSchema.safeParse({ url: "not a URL" }).success, false);
});

test("media deletion route authorizes, validates, and freshly rechecks before Blob deletion", () => {
  const source = readFileSync(new URL("../app/api/media/route.ts", import.meta.url), "utf8");
  const authorization = source.indexOf("requireAdmin");
  const normalization = source.indexOf("normalizeManagedBlobUrl");
  const snapshot = source.indexOf("loadMediaReferenceSnapshot");
  const references = source.indexOf("findMediaReferences");
  const deletion = source.indexOf("del(");

  assert.ok(authorization >= 0 && authorization < normalization);
  assert.ok(normalization < snapshot);
  assert.ok(snapshot < references && references < deletion);
  assert.match(source, /status[^\n]*409|NextResponse\.json\([^\n]*references[^\n]*409/);
  assert.match(source, /fail\([^\n]*422/);
  assert.match(source, /fail\([^\n]*502/);
});

test("Media library filters by kind, unused state, and filename", () => {
  const files = [mediaFile("hero.mp4", [reference("hero")]), mediaFile("unused.webp", [])];

  assert.deepEqual(filterMediaFiles(files, "video", "").map(({ pathname }) => pathname), ["uploads/hero.mp4"]);
  assert.deepEqual(filterMediaFiles(files, "unused", "").map(({ pathname }) => pathname), ["uploads/unused.webp"]);
  assert.deepEqual(filterMediaFiles(files, "all", "UNUSED").map(({ pathname }) => pathname), ["uploads/unused.webp"]);
});

test("failed Media deletion restores the exact visible item", () => {
  const files = [mediaFile("unused.webp", [])];
  const pending = reduceMediaLibraryState(
    { files, snapshot: null, deletingUrl: null, error: null },
    { type: "delete-start", url: files[0].url },
  );

  assert.equal(pending.files.length, 0);

  const restored = reduceMediaLibraryState(pending, { type: "delete-error", message: "删除失败" });
  assert.deepEqual(restored.files, files);
  assert.equal(restored.error, "删除失败");
});

test("media refresh does not discard a pending deletion rollback snapshot", () => {
  const files = [mediaFile("unused.webp", [])];
  const pending = reduceMediaLibraryState(
    { files, snapshot: null, deletingUrl: null, error: null },
    { type: "delete-start", url: files[0].url },
  );
  const refreshed = reduceMediaLibraryState(pending, { type: "replace-files", files });
  const restored = reduceMediaLibraryState(refreshed, { type: "delete-error", message: "删除失败" });

  assert.equal(refreshed.deletingUrl, files[0].url);
  assert.deepEqual(restored.files, files);
  assert.equal(restored.error, "删除失败");
});
