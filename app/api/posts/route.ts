import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const posts = await db.post.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, tag } = await req.json();
  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  const post = await db.post.create({
    data: {
      title: title?.trim() || null,
      body: body.trim(),
      tag: tag?.trim() || null,
    },
  });
  revalidateTag("posts", "max");
  return NextResponse.json(post, { status: 201 });
}
