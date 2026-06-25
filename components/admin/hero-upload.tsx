"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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

export function HeroUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBlobPicker, setShowBlobPicker] = useState(false);
  const [blobFiles, setBlobFiles] = useState<BlobFile[]>([]);
  const [blobLoading, setBlobLoading] = useState(false);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data) => {
        if (data?.blobUrl) setCurrentUrl(data.blobUrl);
      })
      .catch(() => setError("获取当前背景视频失败"));
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

  async function selectBlobFile(file: BlobFile) {
    setShowBlobPicker(false);
    try {
      const saveRes = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: file.url }),
      });
      if (!saveRes.ok) throw new Error("保存到数据库失败");
      setCurrentUrl(file.url);
    } catch (err: any) {
      setError(err?.message || "保存失败");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "video/mp4") {
      setError("仅支持上传 MP4 格式视频");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = async () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (!data.url) {
          setError("未能获取上传后的链接");
          return;
        }
        try {
          const saveRes = await fetch("/api/hero", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blobUrl: data.url }),
          });
          if (!saveRes.ok) throw new Error("保存到数据库失败");
          setCurrentUrl(data.url);
        } catch (err: any) {
          setError(err?.message || "保存失败");
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data.error || `服务器错误 (${xhr.status})`);
        } catch {
          setError(`服务器返回错误 (${xhr.status}): ${xhr.responseText.slice(0, 200)}`);
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("上传失败，请检查网络连接");
    };

    xhr.send(formData);
  }

  return (
    <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">Hero 背景视频</h3>
        <p className="text-xs text-zinc-500 mt-1">
          建议上传 10-20 秒、低码率的 MP4 视频以保证加载速度。
        </p>
      </div>

      {currentUrl && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400">当前背景视频预览：</p>
          <video
            src={currentUrl}
            className="w-full max-h-[200px] object-cover rounded-md border border-zinc-800"
            muted
            controls
            playsInline
          />
        </div>
      )}

      <div className="space-y-2">
        <Input
          type="file"
          accept="video/mp4"
          onChange={handleUpload}
          disabled={uploading}
          className="bg-zinc-950 border-zinc-800 cursor-pointer text-zinc-300 file:text-zinc-200"
        />

        <Button
          type="button"
          variant="outline"
          onClick={openBlobPicker}
          disabled={uploading}
          className="w-full"
        >
          从 Blob 选择
        </Button>

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

        {error && (
          <p className="text-sm text-red-500 bg-red-950/20 border border-red-900/50 p-2 rounded">
            {error}
          </p>
        )}
      </div>

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
