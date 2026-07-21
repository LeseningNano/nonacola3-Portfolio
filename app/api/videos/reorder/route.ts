import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { success, unauthorized, fail, revalidateTags } from "@/lib/api-utils";
import { reorderSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return unauthorized();

  const parsed = reorderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "参数无效", 422);
  }
  const { items } = parsed.data;

  await db.$transaction(
    items.map((item) =>
      db.video.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );

  revalidateTags("videos");
  return success();
}