import type { NextRequest } from "next/server";
import { fail, success } from "@/lib/api-utils";
import type { ReorderItem } from "@/lib/admin-works";
import { reorderSchema } from "@/lib/schemas";

type ReorderRequest = Pick<NextRequest, "json">;

export type ReorderRouteDependencies = {
  authorize: () => Promise<Response | null>;
  commit: (items: ReorderItem[]) => Promise<void>;
  revalidate: () => void;
};

export async function handleReorderPost(
  req: ReorderRequest,
  dependencies: ReorderRouteDependencies,
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
