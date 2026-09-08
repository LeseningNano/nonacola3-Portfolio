import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { ok, created, fail, revalidateTags } from "@/lib/api-utils";
import { postMutateSchema } from "@/lib/schemas";

export async function GET() {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

  const posts = await db.post.findMany({ orderBy: { createdAt: "desc" } });
  return ok(posts);
}

export async function POST(req: NextRequest) {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

  const parsed = postMutateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "参数无效", 422);
  }
  const b = parsed.data;
  const body = b.body.trim();
  if (!body) return fail("内容不能为空");
  const title = b.title?.trim() || null;
  const tag = b.tag?.trim() || null;

  const post = await db.post.create({ data: { title, body, tag, published: b.published ?? true } });
  revalidateTags("posts");
  return created(post);
}
