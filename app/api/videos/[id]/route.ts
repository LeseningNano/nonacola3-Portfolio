import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { ok, success, notFound, fail, revalidateTags } from "@/lib/api-utils";
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
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

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
      ...(b.description !== undefined && { description: b.description }),
      ...(b.summary !== undefined && { summary: b.summary }),
      ...(b.thumbnail !== undefined && { thumbnail: b.thumbnail }),
      ...(b.featured !== undefined && { featured: b.featured }),
      ...(b.order !== undefined && { order: b.order }),
      ...(b.date !== undefined && { date: b.date ? new Date(b.date) : null }),
    },
  });

  revalidateTags("videos");
  return ok(video);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

  const { id } = await params;
  await db.video.delete({ where: { id } });
  revalidateTags("videos");
  return success();
}
