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

test("URL extraction does not alter an unwrapped URL ending in a closing parenthesis", () => {
  const blobEndingInParenthesis = "https://store.public.blob.vercel-storage.com/uploads/hero)";

  assert.deepEqual(extractHttpUrls(blobEndingInParenthesis), [blobEndingInParenthesis]);
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

test("reference lookup preserves nonterminated character references in destinations", () => {
  const copyrightBlob = `${blob}?license=&copy`;
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
    ["work-body", "post-body"],
  );
  assert.deepEqual(
    findMediaReferences(copyrightParameterBlob, snapshot).map(({ kind }) => kind),
    ["post-body"],
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
