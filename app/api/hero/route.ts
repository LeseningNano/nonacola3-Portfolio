import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ok, success, unauthorized, fail, revalidateTags } from "@/lib/api-utils";
import { heroMutateSchema } from "@/lib/schemas";

export async function GET() {
  const hero = await db.heroVideo.findUnique({ where: { id: "singleton" } });
  return ok(hero);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return unauthorized();

  const parsed = heroMutateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "参数无效", 422);
  }
  const { blobUrl } = parsed.data;

  await db.heroVideo.upsert({
    where: { id: "singleton" },
    update: { blobUrl },
    create: { id: "singleton", blobUrl },
  });

  revalidateTags("hero");
  return success();
}
