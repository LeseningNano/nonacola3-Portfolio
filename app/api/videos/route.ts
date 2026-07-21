import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ok, created, unauthorized, fail, revalidateTags } from "@/lib/api-utils";
import { videoCreateSchema } from "@/lib/schemas";

export async function GET() {
  const videos = await db.video.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return ok(videos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return unauthorized();

  const parsed = videoCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "参数无效", 422);
  }
  const b = parsed.data;

  const video = await db.video.create({
    data: {
      title: b.title,
      category: b.category,
      embedUrl: b.embedUrl,
      description: b.description ?? null,
      summary: b.summary ?? null,
      thumbnail: b.thumbnail ?? null,
      featured: b.featured ?? false,
      order: b.order ?? 0,
      date: b.date ? new Date(b.date) : null,
    },
  });

  revalidateTags("videos");
  return created(video);
}