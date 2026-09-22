import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { revalidateTags } from "@/lib/api-utils";
import { handleReorderPost, type ReorderRouteDependencies } from "@/lib/admin-reorder";

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

export async function POST(req: NextRequest) {
  return handleReorderPost(req, reorderRouteDependencies);
}
