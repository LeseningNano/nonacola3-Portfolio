import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, body, tag } = await req.json();
  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  const post = await db.post.update({
    where: { id },
    data: {
      title: title?.trim() || null,
      body: body.trim(),
      tag: tag?.trim() || null,
    },
  });
  revalidateTag("posts", "max");
  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.post.delete({ where: { id } });
  revalidateTag("posts", "max");
  return NextResponse.json({ ok: true });
}
