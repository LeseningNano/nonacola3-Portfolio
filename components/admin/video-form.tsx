"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/toast";

interface VideoData {
  id?: string;
  title: string;
  description: string;
  summary: string;
  category: string;
  embedUrl: string;
  thumbnail: string;
  featured: boolean;
  order: number;
  date: string;
}

export function VideoForm({
  initialData,
  mode,
}: {
  initialData?: VideoData;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [thumbMode, setThumbMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<VideoData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    summary: initialData?.summary ?? "",
    category: initialData?.category ?? "",
    embedUrl: initialData?.embedUrl ?? "",
    thumbnail: initialData?.thumbnail ?? "",
    featured: initialData?.featured ?? false,
    order: initialData?.order ?? 0,
    date: initialData?.date ?? "",
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
      const pathname = `uploads/thumb-${Date.now()}-${safeName}`;

      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob-token",
        onUploadProgress: (p) => setUploadProgress(p.percentage),
      });

      setForm((prev) => ({ ...prev, thumbnail: blob.url }));
      setUploadProgress(100);
    } catch (err: any) {
      toastError("封面上传失败");
    } finally {
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 300);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url =
      mode === "edit" ? `/api/videos/${initialData?.id}` : "/api/videos";
    const method = mode === "edit" ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "保存失败" }));
        toastError(err.error || `保存失败 (${res.status})`);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      toastError("保存失败，请检查网络连接");
      setLoading(false);
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader>
        <CardTitle>{mode === "edit" ? "编辑视频" : "添加视频"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">分类 *</Label>
            <Input
              id="category"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="如：商业广告、短片、纪录片"
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="embedUrl">嵌入链接 *</Label>
            <Input
              id="embedUrl"
              required
              value={form.embedUrl}
              onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
              placeholder="YouTube 或 Bilibili 嵌入链接"
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="thumbnail">封面图</Label>
              <div className="flex rounded-md overflow-hidden border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setThumbMode("url")}
                  className={`px-3 py-1 text-xs transition-colors ${thumbMode === "url" ? "bg-neutral-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}
                >
                  链接
                </button>
                <button
                  type="button"
                  onClick={() => setThumbMode("upload")}
                  className={`px-3 py-1 text-xs transition-colors ${thumbMode === "upload" ? "bg-neutral-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}
                >
                  上传
                </button>
              </div>
            </div>
            {thumbMode === "url" ? (
              <Input
                id="thumbnail"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="bg-neutral-800 border-neutral-700"
              />
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? "上传中..." : "选择文件"}
                  </Button>
                  {form.thumbnail && !uploading && (
                    <span className="text-xs text-neutral-500 truncate max-w-xs">
                      {form.thumbnail}
                    </span>
                  )}
                </div>
                {uploading && (
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-neutral-400 mb-1">
                      <span>上传中</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-200 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {form.thumbnail && (
              <div className="mt-2">
                <img
                  src={form.thumbnail}
                  alt="封面预览"
                  className="w-40 h-24 object-cover rounded border border-neutral-700"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">概要（选填，显示在卡片上）</Label>
            <textarea
              id="summary"
              rows={2}
              value={form.summary}
              onChange={(e) =>
                setForm({ ...form, summary: e.target.value })
              }
              placeholder="简短的概要文字，显示在视频卡片上"
              className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">简介（选填，显示在详情页）</Label>
            <textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="详细的视频简介，支持换行"
              className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">发布日期（选填）</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="featured">精选</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="order">排序权重</Label>
              <Input
                id="order"
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: parseInt(e.target.value) || 0 })
                }
                className="w-24 bg-neutral-800 border-neutral-700"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
