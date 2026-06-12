import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const showreel = await db.showreel.findUnique({
      where: { showreelId: "showreelId" },
    });
    return NextResponse.json({ showreelUrl: showreel?.showreelUrl || "" });
  } catch (error) {
    return NextResponse.json({ showreelUrl: "" });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { showreelUrl } = await request.json();
    
    const showreel = await db.showreel.upsert({
      where: { showreelId: "showreelId" },
      update: { showreelUrl },
      create: { showreelId: "showreelId", showreelUrl },
    });

    return NextResponse.json({ success: true, showreelUrl: showreel.showreelUrl });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
