import "server-only";

import { list, type ListBlobResultBlob } from "@vercel/blob";
import { collectAllManagedBlobs, type MediaReferenceSnapshot } from "@/lib/admin-media";
import { db } from "@/lib/db";

export async function loadMediaReferenceSnapshot(): Promise<MediaReferenceSnapshot> {
  const [hero, showreel, videos, posts] = await Promise.all([
    db.heroVideo.findUnique({ where: { id: "singleton" }, select: { blobUrl: true } }),
    db.showreel.findUnique({
      where: { id: "singleton" },
      select: { showreelUrl: true, videoType: true },
    }),
    db.video.findMany({
      select: { id: true, title: true, embedUrl: true, thumbnail: true, description: true },
    }),
    db.post.findMany({ select: { id: true, title: true, body: true } }),
  ]);

  return { hero, showreel, videos, posts };
}

export async function listAllManagedBlobs(): Promise<ListBlobResultBlob[]> {
  return collectAllManagedBlobs(list);
}
