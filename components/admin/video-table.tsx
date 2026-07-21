"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

interface Video {
  id: string;
  title: string;
  category: string;
  featured: boolean;
  order: number;
}

export function VideoTable({ videos }: { videos: Video[] }) {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [items, setItems] = useState<Video[]>(videos);
  const [saving, setSaving] = useState(false);

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length || saving) return;

    // Reorder locally and normalize order values to 0..n-1
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const normalized = next.map((v, i) => ({ ...v, order: i }));
    setItems(normalized);

    setSaving(true);
    try {
      const res = await fetch("/api/videos/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: normalized.map((v) => ({ id: v.id, order: v.order })),
        }),
      });
      if (!res.ok) throw new Error("保存排序失败");
      router.refresh();
    } catch (err) {
      setItems(items); // rollback
      toastError(err instanceof Error ? err.message : "保存排序失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这个视频吗？")) return;
    const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toastError("删除失败");
      return;
    }
    setItems((prev) => prev.filter((v) => v.id !== id));
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="py-3 px-4 text-neutral-400 font-medium">标题</th>
            <th className="py-3 px-4 text-neutral-400 font-medium">分类</th>
            <th className="py-3 px-4 text-neutral-400 font-medium">精选</th>
            <th className="py-3 px-4 text-neutral-400 font-medium">排序</th>
            <th className="py-3 px-4 text-neutral-400 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((video, index) => (
            <tr key={video.id} className="border-b border-neutral-800/50">
              <td className="py-3 px-4">{video.title}</td>
              <td className="py-3 px-4 text-neutral-400">{video.category}</td>
              <td className="py-3 px-4">{video.featured ? "是" : "否"}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <span className="text-neutral-400 w-6 text-center tabular-nums">{video.order}</span>
                  <button
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0 || saving}
                    className="p-1 text-neutral-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-neutral-400"
                    aria-label="上移"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 1)}
                    disabled={index === items.length - 1 || saving}
                    className="p-1 text-neutral-400 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-neutral-400"
                    aria-label="下移"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500 ml-1" />}
                </div>
              </td>
              <td className="py-3 px-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/videos/${video.id}/edit`)}
                >
                  编辑
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(video.id)}
                >
                  删除
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
