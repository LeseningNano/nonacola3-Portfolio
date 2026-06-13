"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  sizeMB: string;
}

export function ShowreelSettings() {
  const [url, setUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [videoType, setVideoType] = useState<"url" | "upload">("url");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBlobPicker, setShowBlobPicker] = useState(false);
  const [blobFiles, setBlobFiles] = useState<BlobFile[]>([]);
  const [blobLoading, setBlobLoading] = useState(false);

  useEffect(() => {
    fetch("/api/showreel")
      .then((res) => res.json())
      .then((data) => {
        if (data?.showreelUrl) {
          setUrl(data.showreelUrl);
          setSavedUrl(data.showreelUrl);
        }
        if (data?.videoType) setVideoType(data.videoType);
      })
      .finally(() => setLoading(false));
  }, []);

  function openBlobPicker() {
    setBlobLoading(true);
    setShowBlobPicker(true);
    fetch("/api/blob-usage")
      .then((res) => res.json())
      .then((data) => setBlobFiles(data.files || []))
      .catch(() => setError("加载 Blob 文件失败"))
      .finally(() => setBlobLoading(false));
  }

  function selectBlobFile(file: BlobFile) {
    setUrl(file.url);
    setShowBlobPicker(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (data.url) setUrl(data.url);
      } else {
        setError("上传失败，请重试");
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("上传失败，请检查网络");
    };

    xhr.send(formData);
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
            {savedUrl && (
              <div className="space-y-2 mb-3">
                <p className="text-xs text-zinc-400">当前已保存的视频：</p>
                <video
                  src={savedUrl}
                  className="w-full max-h-48 object-contain rounded border border-zinc-700"
                  controls
                  muted
                  playsInline
                />
                <p className="text-xs text-zinc-500 truncate">{savedUrl}</p>
              </div>
            )}
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
              <Button
                type="button"
                variant="outline"
                onClick={openBlobPicker}
              >
                从 Blob 选择
              </Button>
              {url && url !== savedUrl && (
                <span className="text-xs text-zinc-500 truncate max-w-xs">
                  {url}
                </span>
              )}
            </div>
            {uploading && (
              <div className="space-y-1">
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-400 text-right">{progress}%</p>
              </div>
            )}
          </>
        )}
      </div>

      {url && videoType === "url" && (
        <div className="rounded overflow-hidden border border-zinc-700">
          <iframe
            src={url}
            className="w-full aspect-video"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {url && videoType === "upload" && url !== savedUrl && (
        <div className="space-y-1">
          <p className="text-xs text-zinc-400">新上传的视频预览：</p>
          <div className="rounded overflow-hidden border border-zinc-700">
            <video src={url} controls className="w-full max-h-48 object-contain" />
          </div>
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

      <Dialog open={showBlobPicker} onOpenChange={setShowBlobPicker}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>选择已上传的文件</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {blobLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            ) : blobFiles.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">暂无已上传的文件</p>
            ) : (
              blobFiles.map((file) => (
                <button
                  key={file.url}
                  type="button"
                  onClick={() => selectBlobFile(file)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors text-left"
                >
                  {file.pathname.match(/\.(mp4|webm|mov|avi)$/i) ? (
                    <video
                      src={file.url}
                      className="w-24 h-16 object-cover rounded flex-shrink-0"
                      muted
                    />
                  ) : file.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={file.url}
                      alt={file.pathname}
                      className="w-24 h-16 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-16 bg-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-zinc-500">文件</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{file.pathname}</p>
                    <p className="text-xs text-zinc-500">{file.sizeMB} MB</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
