"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Video {
  id: string;
  title: string;
  category: string;
  featured: boolean;
  order: number;
}

export function VideoTable({ videos }: { videos: Video[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("确定删除这个视频吗？")) return;
    await fetch(`/api/videos/${id}`, { method: "DELETE" });
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
          {videos.map((video) => (
            <tr key={video.id} className="border-b border-neutral-800/50">
              <td className="py-3 px-4">{video.title}</td>
              <td className="py-3 px-4 text-neutral-400">{video.category}</td>
              <td className="py-3 px-4">{video.featured ? "是" : "否"}</td>
              <td className="py-3 px-4 text-neutral-400">{video.order}</td>
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
