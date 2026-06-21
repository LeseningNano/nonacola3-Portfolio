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

  try {
    const blob = await put(`upload-${Date.now()}-${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });

    console.log(`[upload] Success: ${blob.url}`);
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[upload] Blob error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
