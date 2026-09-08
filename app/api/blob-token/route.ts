import { NextRequest, NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const authorizationError = await requireAdmin();
  if (authorizationError) return authorizationError;

  const body = await req.json();

  const jsonResponse = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async (pathname) => {
      return {
        allowOverwrite: true,
        maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
      };
    },
    onUploadCompleted: async () => {},
  });

  return NextResponse.json(jsonResponse);
}
