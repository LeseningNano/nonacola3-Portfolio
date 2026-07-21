import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ok, success, unauthorized, fail, notFound, revalidateTags } from "@/lib/api-utils";
import { postMutateSchema } from "@/lib/schemas";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return unauthorized();

  const { id } = await params;
  const parsed = postMutateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "参数无效", 422);
  }
  const b = parsed.data;
  const body = b.body.trim();
  if (!body) return fail("内容不能为空");
  const title = b.title?.trim() || null;
  const tag = b.tag?.trim() || null;

  const post = await db.post.update({ where: { id }, data: { title, body, tag } });
  revalidateTags("posts");
  return ok(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return unauthorized();

  const { id } = await params;
  try {
    await db.post.delete({ where: { id } });
  } catch {
    return notFound();
  }
  revalidateTags("posts");
  return success();
}