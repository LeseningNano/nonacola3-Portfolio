"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export function HeroUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data) => {
        if (data?.blobUrl) setCurrentUrl(data.blobUrl);
      })
      .catch(() => setError("获取当前背景视频失败"));
  }, []);

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
        setError("上传文件服务错误");
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("上传失败，请检查网络");
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
    </div>
  );
}
