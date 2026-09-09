import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/api-auth";
import { ok, success, fail } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { getHero } from "@/lib/data";
import { heroMutateSchema } from "@/lib/schemas";

export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  const hero = await getHero();
  const response = ok(hero);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=60"
  );
  return response;
}

export async function PUT(req: NextRequest) {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

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

  revalidateTag("hero", { expire: 0 });
  revalidatePath("/api/hero");
  return success();
}
