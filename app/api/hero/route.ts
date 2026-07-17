import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const hero = await db.heroVideo.findUnique({
    where: { id: "singleton" },
  });
  return NextResponse.json(hero);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blobUrl } = await req.json();

  const hero = await db.heroVideo.upsert({
    where: { id: "singleton" },
    update: { blobUrl },
    create: { id: "singleton", blobUrl },
  });

  revalidateTag("hero", "max");
  return NextResponse.json(hero);
}
