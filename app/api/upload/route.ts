import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/api-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { fail } from "@/lib/api-utils";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return fail("No file");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  const fileName = `upload-${Date.now()}-${safeName}`;

  // Vercel environment: use Blob storage
  if (process.env.VERCEL) {
    try {
      const blob = await put(fileName, file, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url });
    } catch (err: any) {
      return fail(`Blob upload failed: ${err?.message || "unknown"}`, 500);
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
    return NextResponse.json({ url });
  } catch {
    return fail("Upload failed", 500);
  }
}
