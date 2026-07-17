import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const posts = await db.post.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const post = await db.post.create({
    data: {
      title: body.title,
      url: body.url || null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  revalidateTag("posts", "max");
  return NextResponse.json(post, { status: 201 });
}
