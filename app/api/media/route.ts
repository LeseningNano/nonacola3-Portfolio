import { requireAdmin } from "@/lib/api-auth";
import { normalizeManagedBlobUrl } from "@/lib/admin-media";
import { loadMediaReferenceSnapshot } from "@/lib/admin-media.server";
import { findMediaReferences } from "@/lib/admin-media";
import { fail, success } from "@/lib/api-utils";
import { mediaDeleteSchema } from "@/lib/schemas";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const parsed = mediaDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid media URL", 422);
  }

  const normalizedUrl = normalizeManagedBlobUrl(parsed.data.url);
  if (!normalizedUrl) return fail("URL is not a managed Vercel Blob URL", 422);

  let snapshot;
  try {
    snapshot = await loadMediaReferenceSnapshot();
  } catch {
    return fail("Failed to verify media references", 500);
  }

  const references = findMediaReferences(normalizedUrl, snapshot);
  if (references.length > 0) return NextResponse.json({ error: "Media is still referenced", references }, { status: 409 });

  try {
    await del(normalizedUrl);
  } catch {
    return fail("Failed to delete media from Blob storage", 502);
  }

  return success();
}
