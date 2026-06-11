import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const hero = await db.heroVideo.findUnique({
    where: { id: "singleton" },
  });
  return NextResponse.json(hero);
}

export async function PUT(req: NextRequest) {
  const { blobUrl } = await req.json();

  const hero = await db.heroVideo.upsert({
    where: { id: "singleton" },
    update: { blobUrl },
    create: { id: "singleton", blobUrl },
  });

  return NextResponse.json(hero);
}
