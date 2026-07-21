import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ok, success, unauthorized, notFound, fail, revalidateTags } from "@/lib/api-utils";
import { videoUpdateSchema } from "@/lib/schemas";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const video = await db.video.findUnique({ where: { id } });
  if (!video) return notFound();
  return ok(video);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return unauthorized();

  const { id } = await params;
  const parsed = videoUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "参数无效", 422);
  }
  const b = parsed.data;

  const video = await db.video.update({
    where: { id },
    data: {
      ...(b.title !== undefined && { title: b.title }),
      ...(b.category !== undefined && { category: b.category }),
      ...(b.embedUrl !== undefined && { embedUrl: b.embedUrl }),
      description: b.description ?? null,
      summary: b.summary ?? null,
      thumbnail: b.thumbnail ?? null,
      ...(b.featured !== undefined && { featured: b.featured }),
      ...(b.order !== undefined && { order: b.order }),
      date: b.date ? new Date(b.date) : null,
    },
  });

  revalidateTags("videos");
  return ok(video);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return unauthorized();

  const { id } = await params;
  await db.video.delete({ where: { id } });
  revalidateTags("videos");
  return success();
}