"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VideoData {
  id?: string;
  title: string;
  description: string;
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
  const [loading, setLoading] = useState(false);
  const [thumbMode, setThumbMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<VideoData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "",
    embedUrl: initialData?.embedUrl ?? "",
    thumbnail: initialData?.thumbnail ?? "",
    featured: initialData?.featured ?? false,
    order: initialData?.order ?? 0,
    date: initialData?.date ?? "",
  });

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.timeout = 120000;

    let progressTimer: ReturnType<typeof setInterval> | null = null;

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const pct = Math.round((ev.loaded / ev.total) * 100);
        setUploadProgress(pct);
        if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
      }
    };

    // Fallback: if no progress events fire, simulate progress
    progressTimer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) { if (progressTimer) clearInterval(progressTimer); return prev; }
        return prev + 10;
      });
    }, 500);

    xhr.onload = () => {
      if (progressTimer) clearInterval(progressTimer);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            setForm((prev) => ({ ...prev, thumbnail: data.url }));
          }
        } catch { /* ignore */ }
        setUploadProgress(100);
      } else {
        console.error("Upload failed:", xhr.status, xhr.responseText);
      }
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 300);
    };

    xhr.onerror = () => {
      if (progressTimer) clearInterval(progressTimer);
      console.error("Upload failed");
      setUploading(false);
      setUploadProgress(0);
    };

    xhr.ontimeout = () => {
      if (progressTimer) clearInterval(progressTimer);
      console.error("Upload timed out");
      setUploading(false);
      setUploadProgress(0);
    };

    xhr.send(formData);
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
        alert(err.error || `保存失败 (${res.status})`);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Save failed:", err);
      alert("保存失败，请检查网络连接");
      setLoading(false);
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
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
              className="bg-zinc-800 border-zinc-700"
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
              className="bg-zinc-800 border-zinc-700"
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
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="thumbnail">封面图</Label>
              <div className="flex rounded-md overflow-hidden border border-zinc-700">
                <button
                  type="button"
                  onClick={() => setThumbMode("url")}
                  className={`px-3 py-1 text-xs transition-colors ${thumbMode === "url" ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
                >
                  链接
                </button>
                <button
                  type="button"
                  onClick={() => setThumbMode("upload")}
                  className={`px-3 py-1 text-xs transition-colors ${thumbMode === "upload" ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
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
                className="bg-zinc-800 border-zinc-700"
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
                    <span className="text-xs text-zinc-500 truncate max-w-xs">
                      {form.thumbnail}
                    </span>
                  )}
                </div>
                {uploading && (
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                      <span>上传中</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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
                  className="w-40 h-24 object-cover rounded border border-zinc-700"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述（选填）</Label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">发布日期（选填）</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="bg-zinc-800 border-zinc-700"
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
                className="w-24 bg-zinc-800 border-zinc-700"
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
