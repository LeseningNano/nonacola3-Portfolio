"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

export function ShowreelSettings() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/showreel")
      .then((res) => res.json())
      .then((data) => {
        if (data?.showreelUrl) setUrl(data.showreelUrl);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/showreel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showreelUrl: url }),
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
          更换首页展示的 Showreel 嵌入链接
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="showreelUrl">嵌入链接 (YouTube / Bilibili)</Label>
        <Input
          id="showreelUrl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="粘贴嵌入代码或链接"
          className="bg-zinc-800 border-zinc-700"
        />
      </div>
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
