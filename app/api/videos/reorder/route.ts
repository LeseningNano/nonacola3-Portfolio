import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = await req.json();
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await db.$transaction(
    items.map((item: { id: string; order: number }) =>
      db.video.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );

  revalidateTag("videos", "max");
  return NextResponse.json({ success: true });
}
