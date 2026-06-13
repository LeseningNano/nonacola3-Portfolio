"use client";

import { useEffect, useState } from "react";

export function BlobUsage() {
  const [data, setData] = useState<{ count: number; totalSizeMB: string } | null>(null);

  useEffect(() => {
    fetch("/api/blob-usage")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="text-xs text-zinc-500 flex items-center gap-3">
      <span>Blob 存储：{data.count} 个文件，共 {data.totalSizeMB} MB</span>
    </div>
  );
}
