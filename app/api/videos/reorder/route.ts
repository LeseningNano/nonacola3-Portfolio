import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { success, fail, revalidateTags } from "@/lib/api-utils";
import type { ReorderItem } from "@/lib/admin-works";
import { reorderSchema } from "@/lib/schemas";

type ReorderRequest = Pick<NextRequest, "json">;

type ReorderRouteDependencies = {
  authorize: typeof requireAdmin;
  commit: (items: ReorderItem[]) => Promise<void>;
  revalidate: () => void;
};

const reorderRouteDependencies: ReorderRouteDependencies = {
  authorize: requireAdmin,
  commit: async (items) => {
    await db.$transaction(
      items.map((item) =>
        db.video.update({
          where: { id: item.id },
          data: { order: item.order, featured: item.featured },
        })
      )
    );
  },
  revalidate: () => revalidateTags("videos"),
};

export async function handleReorderPost(
  req: ReorderRequest,
  dependencies: ReorderRouteDependencies = reorderRouteDependencies,
) {
  const authorizationError = await dependencies.authorize();
  if (authorizationError) return authorizationError;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return fail("参数无效", 422);
  }

  const parsed = reorderSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "参数无效", 422);
  }

  await dependencies.commit(parsed.data.items);
  dependencies.revalidate();
  return success();
}

export async function POST(req: NextRequest) {
  return handleReorderPost(req);
}
