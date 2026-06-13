import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { blobs } = await list();
    const totalSize = blobs.reduce((sum, blob) => sum + (blob.size || 0), 0);
    const count = blobs.length;

    return NextResponse.json({
      count,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    });
  } catch (error) {
    return NextResponse.json({ count: 0, totalSize: 0, totalSizeMB: "0" });
  }
}
