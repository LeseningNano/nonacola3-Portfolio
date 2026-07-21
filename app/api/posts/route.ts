import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ok, created, unauthorized, fail, revalidateTags } from "@/lib/api-utils";
import { postMutateSchema } from "@/lib/schemas";

export async function GET() {
  const posts = await db.post.findMany({ orderBy: { createdAt: "desc" } });
  return ok(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return unauthorized();

  const parsed = postMutateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "参数无效", 422);
  }
  const b = parsed.data;
  const body = b.body.trim();
  if (!body) return fail("内容不能为空");
  const title = b.title?.trim() || null;
  const tag = b.tag?.trim() || null;

  const post = await db.post.create({ data: { title, body, tag } });
  revalidateTags("posts");
  return created(post);
}