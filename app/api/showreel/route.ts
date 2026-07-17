import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const showreel = await db.showreel.findUnique({
      where: { showreelId: "showreelId" },
    });
    return NextResponse.json({
      showreelUrl: showreel?.showreelUrl || "",
      videoType: showreel?.videoType || "url",
    });
  } catch (error) {
    return NextResponse.json({ showreelUrl: "", videoType: "url" });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { showreelUrl, videoType } = await request.json();
    
    const showreel = await db.showreel.upsert({
      where: { showreelId: "showreelId" },
      update: { showreelUrl, videoType: videoType || "url" },
      create: { showreelId: "showreelId", showreelUrl, videoType: videoType || "url" },
    });

    revalidateTag("showreel", "max");
    return NextResponse.json({
      success: true,
      showreelUrl: showreel.showreelUrl,
      videoType: showreel.videoType,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
