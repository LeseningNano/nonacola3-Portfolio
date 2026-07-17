import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const videos = await db.video.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  console.log("[videos] POST received");
  const session = await auth();
  if (!session) {
    console.log("[videos] Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  console.log("[videos] Creating video:", body.title);
  const video = await db.video.create({
    data: {
      title: body.title,
      description: body.description,
      summary: body.summary,
      category: body.category,
      embedUrl: body.embedUrl,
      thumbnail: body.thumbnail,
      featured: body.featured ?? false,
      order: body.order ?? 0,
      date: body.date ? new Date(body.date) : null,
    },
  });

  console.log("[videos] Created:", video.id);
  revalidateTag("videos", "max");
  return NextResponse.json(video, { status: 201 });
}
