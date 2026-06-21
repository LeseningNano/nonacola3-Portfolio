import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  console.log("[upload] Request received");
  const session = await auth();
  if (!session) {
    console.log("[upload] Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  console.log(`[upload] Uploading: ${file.name}, size: ${file.size}, type: ${file.type}`);
  console.log(`[upload] File constructor: ${file.constructor.name}`);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  const blobName = `upload-${Date.now()}-${safeName}`;
  console.log(`[upload] Blob name: ${blobName}`);

  try {
    const blob = await Promise.race([
      put(blobName, file, {
        access: "public",
        contentType: file.type,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Blob upload timed out after 30s")), 30000)
      ),
    ]);

    console.log(`[upload] Success: ${blob.url}`);
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[upload] Blob error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
