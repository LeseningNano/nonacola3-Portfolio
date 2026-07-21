import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// 实体类成功响应：直接透传对象（保持与客户端现有用法兼容）
export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

// 无内容成功（删除/更新的轻量应答），统一为 { success: true }
export function success(status = 200) {
  return NextResponse.json({ success: true }, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound(msg = "Not found") {
  return NextResponse.json({ error: msg }, { status: 404 });
}

export function revalidateTags(...tags: string[]) {
  for (const t of tags) {
    try {
      revalidateTag(t, "max");
    } catch {
      // revalidateTag may throw outside request scope (build)
    }
  }
}