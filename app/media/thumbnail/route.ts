import { createThumbnailProxyResponse } from "@/lib/works-index";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("url") ?? "";
  return createThumbnailProxyResponse(source);
}
