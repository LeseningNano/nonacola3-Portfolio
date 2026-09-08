import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { ok, success, fail, revalidateTags } from "@/lib/api-utils";
import { showreelMutateSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const showreel = await db.showreel.findUnique({ where: { id: "singleton" } });
    return NextResponse.json({
      showreelUrl: showreel?.showreelUrl || "",
      videoType: showreel?.videoType || "url",
    });
  } catch {
    return NextResponse.json({ showreelUrl: "", videoType: "url" });
  }
}

export async function POST(request: Request) {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

  const parsed = showreelMutateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "参数无效", 422);
  }
  const b = parsed.data;

  try {
    const showreel = await db.showreel.upsert({
      where: { id: "singleton" },
      update: { showreelUrl: b.showreelUrl, videoType: b.videoType ?? "url" },
      create: { id: "singleton", showreelUrl: b.showreelUrl, videoType: b.videoType ?? "url" },
    });
    revalidateTags("showreel");
    return success();
  } catch {
    return fail("Failed to update", 500);
  }
}
