import { NextResponse } from "next/server";
import { buildMediaReferenceIndex } from "@/lib/admin-media";
import {
  listAllManagedBlobs,
  loadMediaReferenceSnapshot,
} from "@/lib/admin-media.server";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

  try {
    const [blobs, snapshot] = await Promise.all([
      listAllManagedBlobs(),
      loadMediaReferenceSnapshot(),
    ]);
    const referenceIndex = buildMediaReferenceIndex(
      blobs.map(({ url }) => url),
      snapshot,
    );
    const totalSize = blobs.reduce((sum, blob) => sum + (blob.size || 0), 0);
    const count = blobs.length;

    const files = blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size || 0,
      sizeMB: ((blob.size || 0) / (1024 * 1024)).toFixed(2),
      references: referenceIndex[blob.url] ?? [],
    }));

    return NextResponse.json({
      count,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      files,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load media inventory" },
      { status: 500 },
    );
  }
}
