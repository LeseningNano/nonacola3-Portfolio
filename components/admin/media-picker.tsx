"use client";

import { useId, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { MediaFile } from "@/lib/admin-media";

type BlobFile = Pick<MediaFile, "url" | "pathname" | "size" | "sizeMB" | "references">;

export type MediaPickerProps = {
  kind: "image" | "video";
  value: string;
  onSelect: (url: string) => void;
  label: string;
  disabled?: boolean;
};

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|m4v|ogv)$/i;

function matchesKind(file: BlobFile, kind: MediaPickerProps["kind"]) {
  const pathname = file.pathname.split(/[?#]/, 1)[0] ?? "";
  return (kind === "image" ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS).test(pathname);
}

export function MediaPicker({ kind, value, onSelect, label, disabled = false }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerId = `media-picker-${kind}-${useId().replace(/:/g, "")}`;

  async function loadFiles() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/blob-usage");
      if (!response.ok) throw new Error("无法加载媒体文件");
      const data = (await response.json()) as { files?: BlobFile[] };
      setFiles((data.files ?? []).filter((file) => matchesKind(file, kind)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "无法加载媒体文件");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen && disabled) return;
    if (!nextOpen && uploading) return;
    setOpen(nextOpen);
    if (nextOpen) void loadFiles();
  }

  function choose(url: string) {
    if (uploading) return;
    onSelect(url);
    setOpen(false);
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validMime =
      kind === "image"
        ? ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)
        : file.type.startsWith("video/");
    if (!validMime) {
      setError(kind === "image" ? "请选择 JPEG、PNG、WebP 或 GIF 图片" : "请选择视频文件");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
      const pathname = `uploads/work-${kind}-${Date.now()}-${safeName}`;
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob-token",
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      if (!blob.url) throw new Error("上传完成但未返回文件地址");
      setProgress(100);
      onSelect(blob.url);
      setOpen(false);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败，请重试");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const accept = kind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "video/*";
  const dialogTitle = kind === "image" ? "选择图片" : "选择视频";

  return (
    <div className="space-y-2">
      <Label htmlFor={triggerId}>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          id={triggerId}
          type="button"
          variant="outline"
          aria-label={label}
          disabled={disabled}
          onClick={() => handleOpenChange(true)}
        >
          选择媒体
        </Button>
        {value ? <span className="min-w-0 flex-1 truncate text-xs text-neutral-400">{value}</span> : null}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[75vh] max-w-2xl bg-neutral-950 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>从媒体库选择，或上传一个新文件。</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              aria-label={`上传${kind === "image" ? "图片" : "视频"}`}
              onChange={handleUpload}
              className="sr-only"
            />
            <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              {uploading ? `上传中 ${progress}%` : "上传新文件"}
            </Button>
            {uploading ? (
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-800" aria-label={`上传进度 ${progress}%`}>
                <div className="h-full bg-white transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            ) : null}
          </div>

          <div className="max-h-[48vh] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-400">
                <Loader2 className="animate-spin" /> 正在加载媒体库…
              </div>
            ) : error ? (
              <div className="space-y-3 py-8 text-center">
                <p role="alert" className="text-sm text-red-300">{error}</p>
                <Button type="button" variant="outline" onClick={() => void loadFiles()}>重试</Button>
              </div>
            ) : files.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-500">没有可用的{kind === "image" ? "图片" : "视频"}。</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {files.map((file) => (
                  <button
                    key={file.url}
                    type="button"
                    disabled={uploading}
                    onClick={() => choose(file.url)}
                    className="overflow-hidden rounded-lg border border-white/10 text-left transition-colors hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {kind === "image" ? (
                      // Blob media is user-managed and may use arbitrary public hosts.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.url} alt="" className="aspect-video w-full object-cover" />
                    ) : (
                      <video src={file.url} className="aspect-video w-full object-cover" muted preload="metadata" />
                    )}
                    <span className="block truncate px-3 pt-2 text-sm text-neutral-200">{file.pathname}</span>
                    <span className="block px-3 pb-2 text-xs text-neutral-500">{file.sizeMB} MB</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
