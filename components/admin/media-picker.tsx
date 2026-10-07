"use client";

/* eslint-disable @next/next/no-img-element -- Blob media is user-managed and may use arbitrary public hosts. */

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MediaFile } from "@/lib/admin-media";
import { cn } from "@/lib/utils";

export type BlobFile = Pick<MediaFile, "url" | "pathname" | "size" | "sizeMB" | "references">;
type MediaKind = "image" | "video";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|m4v|ogv)$/i;
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".m4v": "video/x-m4v",
  ".ogv": "video/ogg",
};

function matchesKind(file: BlobFile, kind: MediaKind) {
  const pathname = file.pathname.split(/[?#]/, 1)[0] ?? "";
  return (kind === "image" ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS).test(pathname);
}

function matchesAcceptedType(file: BlobFile, acceptedTypes?: string) {
  if (!acceptedTypes) return true;

  const pathname = file.pathname.split(/[?#]/, 1)[0] ?? "";
  const extension = pathname.match(/\.[^.]+$/)?.[0]?.toLowerCase();
  const mimeType = extension ? MIME_TYPE_BY_EXTENSION[extension] : undefined;

  return acceptedTypes.split(",").some((acceptedType) => {
    const type = acceptedType.trim().toLowerCase();
    if (!type) return false;
    if (type.startsWith(".")) return type === extension;
    if (type.endsWith("/*")) return mimeType?.startsWith(type.slice(0, -1)) ?? false;
    return type === mimeType;
  });
}

export function filterMediaPickerFiles(files: BlobFile[], kind: MediaKind, acceptedTypes?: string) {
  return files.filter((file) => matchesKind(file, kind) && matchesAcceptedType(file, acceptedTypes));
}

function defaultAccept(kind: MediaKind, accept?: string) {
  return accept ?? (kind === "image" ? IMAGE_MIME_TYPES.join(",") : "video/*");
}

export async function uploadMediaFile(file: File, kind: MediaKind, acceptedTypes: string | undefined, onProgress: (percentage: number) => void): Promise<string> {
  const validMime = kind === "image" ? IMAGE_MIME_TYPES.includes(file.type) : file.type.startsWith("video/");
  const allowedByCaller = !acceptedTypes || acceptedTypes.split(",").map((type) => type.trim()).includes(file.type);
  if (!validMime || !allowedByCaller) {
    throw new Error(kind === "image" ? "请选择 JPEG、PNG、WebP 或 GIF 图片" : "请选择视频文件");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  const pathname = `uploads/work-${kind}-${Date.now()}-${safeName}`;
  const { upload } = await import("@vercel/blob/client");
  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/blob-token",
    onUploadProgress: ({ percentage }) => onProgress(Math.round(percentage)),
  });
  if (!blob.url) throw new Error("上传完成但未返回文件地址");
  onProgress(100);
  return blob.url;
}

export type MediaUploadOptions = {
  kind: MediaKind;
  label: string;
  accept?: string;
  onUploaded: (url: string) => void;
};

export function useMediaUpload({ kind, label, accept, onUploaded }: MediaUploadOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      onUploaded(await uploadMediaFile(file, kind, accept, setProgress));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败，请重试");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const input: ReactNode = (
    <input
      ref={inputRef}
      type="file"
      accept={defaultAccept(kind, accept)}
      aria-label={label}
      onChange={(event) => void handleChange(event)}
      className="hidden"
      tabIndex={-1}
    />
  );

  const openFilePicker = useCallback(() => inputRef.current?.click(), []);

  return { input, openFilePicker, uploading, progress, error };
}

export function MediaUploadButton({ kind, label, accept, disabled = false, onUploaded, className }: MediaUploadOptions & { disabled?: boolean; className?: string }) {
  const { input, openFilePicker, uploading, progress, error } = useMediaUpload({ kind, label, accept, onUploaded });

  return (
    <div className="space-y-1.5">
      {input}
      <Button type="button" size="sm" variant="outline" disabled={disabled || uploading} onClick={openFilePicker} className={className}>
        {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
        {uploading ? `上传中 ${progress}%` : label}
      </Button>
      {error ? <p role="alert" className="max-w-60 text-xs text-admin-danger">{error}</p> : null}
    </div>
  );
}

export type MediaPickerDialogProps = {
  kind: MediaKind;
  accept?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (url: string) => void;
};

export function MediaPickerDialog({ kind, accept, open, onOpenChange, value, onSelect }: MediaPickerDialogProps) {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const kindLabel = kind === "image" ? "图片" : "视频";
  const upload = useMediaUpload({ kind, accept, label: `上传${kindLabel}`, onUploaded: onSelect });

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/blob-usage");
      if (!response.ok) throw new Error("无法加载媒体文件");
      const data = (await response.json()) as { files?: BlobFile[] };
      setFiles(filterMediaPickerFiles(data.files ?? [], kind, accept));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "无法加载媒体文件");
    } finally {
      setLoading(false);
    }
  }, [accept, kind]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void loadFiles(), 0);
    return () => window.clearTimeout(timer);
  }, [loadFiles, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && upload.uploading) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl rounded-lg bg-admin-panel ring-admin-line sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>选择{kindLabel}</DialogTitle>
          <DialogDescription>从媒体库选择，或上传新文件。</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          {upload.input}
          <Button type="button" size="sm" variant="outline" disabled={upload.uploading} onClick={upload.openFilePicker}>
            {upload.uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
            {upload.uploading ? `上传中 ${upload.progress}%` : "上传新文件"}
          </Button>
          {upload.uploading ? (
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-admin-raised" role="progressbar" aria-label="上传进度" aria-valuenow={upload.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-admin-accent transition-[width]" style={{ width: `${upload.progress}%` }} />
            </div>
          ) : null}
        </div>
        {upload.error ? <p role="alert" className="text-xs text-admin-danger">{upload.error}</p> : null}

        <div className="max-h-[52vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-admin-fg-2">
              <Loader2 className="animate-spin" aria-hidden="true" /> 正在加载媒体库…
            </div>
          ) : loadError ? (
            <div className="space-y-3 py-8 text-center">
              <p role="alert" className="text-sm text-admin-danger">{loadError}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadFiles()}>重试</Button>
            </div>
          ) : files.length === 0 ? (
            <p className="py-12 text-center text-sm text-admin-fg-3">没有可用的{kindLabel}。</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {files.map((file) => {
                const current = file.url === value;
                return (
                  <button
                    key={file.url}
                    type="button"
                    disabled={upload.uploading}
                    aria-current={current ? "true" : undefined}
                    onClick={() => onSelect(file.url)}
                    className={cn(
                      "min-w-0 overflow-hidden rounded-sm bg-admin-raised text-left outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-admin-accent",
                      current ? "ring-2 ring-admin-accent" : "ring-1 ring-transparent hover:ring-admin-line-strong",
                    )}
                  >
                    <span className="relative block aspect-video bg-admin-canvas">
                      {kind === "image"
                        ? <img src={file.url} alt="" className="size-full object-cover" />
                        : <video src={file.url} className="size-full object-cover" muted preload="metadata" />}
                      {current ? <span className="absolute top-1.5 left-1.5 rounded-[3px] bg-admin-accent px-1.5 text-xs font-medium text-admin-accent-fg">当前</span> : null}
                    </span>
                    <span className="block truncate px-2 pt-1.5 font-admin-mono text-xs text-admin-fg" title={file.pathname}>{file.pathname}</span>
                    <span className="block px-2 pb-1.5 font-admin-mono text-xs text-admin-fg-3">{file.sizeMB} MB</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
