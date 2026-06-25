import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const maxDuration = 60;

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

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  const fileName = `upload-${Date.now()}-${safeName}`;
  console.log(`[upload] Uploading: ${file.name}, size: ${file.size}, type: ${file.type}`);

  // Vercel environment: use Blob storage
  if (process.env.VERCEL) {
    try {
      const blob = await put(fileName, file, {
        access: "public",
        contentType: file.type,
      });
      console.log(`[upload] Blob success: ${blob.url}`);
      return NextResponse.json({ url: blob.url });
    } catch (err: any) {
      console.error("[upload] Blob error:", err?.message || err);
      return NextResponse.json({ error: `Blob upload failed: ${err?.message || "unknown"}` }, { status: 500 });
    }
  }

  // Local development: save to public/uploads/
  try {
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    const url = `/uploads/${fileName}`;
    console.log(`[upload] Local success: ${url}`);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload] Local error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
