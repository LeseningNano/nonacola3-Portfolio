"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

export function ShowreelSettings() {
  const [url, setUrl] = useState("");
  const [videoType, setVideoType] = useState<"url" | "upload">("url");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/showreel")
      .then((res) => res.json())
      .then((data) => {
        if (data?.showreelUrl) setUrl(data.showreelUrl);
        if (data?.videoType) setVideoType(data.videoType);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setUrl(data.url);
      }
    } catch (err) {
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/showreel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showreelUrl: url, videoType }),
      });
      if (!res.ok) throw new Error("保存失败");
    } catch (err) {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900 flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">Showreel 视频</h3>
        <p className="text-xs text-zinc-500 mt-1">
          更换首页展示的 Showreel 视频
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm">来源：</Label>
        <div className="flex rounded-md overflow-hidden border border-zinc-700">
          <button
            type="button"
            onClick={() => setVideoType("url")}
            className={`px-3 py-1 text-xs transition-colors ${videoType === "url" ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
          >
            嵌入链接
          </button>
          <button
            type="button"
            onClick={() => setVideoType("upload")}
            className={`px-3 py-1 text-xs transition-colors ${videoType === "upload" ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
          >
            本地上传
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {videoType === "url" ? (
          <>
            <Label htmlFor="showreelUrl">嵌入链接 (YouTube / Bilibili)</Label>
            <Input
              id="showreelUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="粘贴嵌入代码或链接"
              className="bg-zinc-800 border-zinc-700"
            />
          </>
        ) : (
          <>
            <Label>上传视频文件</Label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "上传中..." : "选择视频文件"}
              </Button>
              {url && (
                <span className="text-xs text-zinc-500 truncate max-w-xs">
                  {url}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {url && (
        <div className="rounded overflow-hidden border border-zinc-700">
          {videoType === "upload" ? (
            <video src={url} controls className="w-full max-h-48 object-contain" />
          ) : (
            <iframe
              src={url}
              className="w-full aspect-video"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        保存设置
      </Button>
    </div>
  );
}
