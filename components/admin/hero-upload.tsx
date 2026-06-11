"use client";

import { useState } from "react";

export function HeroUpload() {
  const [uploading, setUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const { url } = await res.json();

    await fetch("/api/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blobUrl: url }),
    });

    setCurrentUrl(url);
    setUploading(false);
  }

  return (
    <div className="p-4 border border-zinc-800 rounded-lg">
      <h3 className="text-sm font-medium mb-2">Hero 背景视频</h3>
      {currentUrl && (
        <video src={currentUrl} className="w-full rounded mb-2" muted />
      )}
      <div>
        <input
          type="file"
          accept="video/mp4"
          onChange={handleUpload}
          className="text-sm"
        />
        {uploading && <p className="text-sm text-zinc-500 mt-1">上传中...</p>}
      </div>
    </div>
  );
}
