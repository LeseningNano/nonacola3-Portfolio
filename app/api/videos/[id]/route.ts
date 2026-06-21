import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const video = await db.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(video);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const video = await db.video.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      embedUrl: body.embedUrl,
      thumbnail: body.thumbnail,
      featured: body.featured,
      order: body.order,
      date: body.date ? new Date(body.date) : null,
    },
  });

  return NextResponse.json(video);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.video.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
