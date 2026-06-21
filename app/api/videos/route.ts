import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const videos = await db.video.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const video = await db.video.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      embedUrl: body.embedUrl,
      thumbnail: body.thumbnail,
      featured: body.featured ?? false,
      order: body.order ?? 0,
      date: body.date ? new Date(body.date) : null,
    },
  });

  return NextResponse.json(video, { status: 201 });
}
