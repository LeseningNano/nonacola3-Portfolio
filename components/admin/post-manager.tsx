"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from "lucide-react";

interface Post {
  id: string;
  title: string;
  url: string | null;
  date: string;
}

export function PostManager({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), url: url.trim() || null, date }),
      });
      if (!res.ok) throw new Error("创建失败");
      const post = await res.json();
      setPosts((prev) => [post, ...prev]);
      setTitle("");
      setUrl("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这条 News？")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      setPosts((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="post-title" className="text-zinc-400">标题</Label>
          <Input
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：新作品《xxx》发布 / 《xxx》制作幕后"
            className="bg-zinc-800 border-zinc-700"
            required
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="post-url" className="text-zinc-400">链接（可选）</Label>
          <Input
            id="post-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="bg-zinc-800 border-zinc-700"
          />
        </div>
        <div className="w-40 space-y-1">
          <Label htmlFor="post-date" className="text-zinc-400">日期</Label>
          <Input
            id="post-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-zinc-800 border-zinc-700"
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "添加"}
        </Button>
      </form>

      {posts.length === 0 ? (
        <p className="text-zinc-500">暂无 News，添加第一条吧。</p>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-900/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{post.title}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(post.date).toLocaleDateString("zh-CN")}
                  {post.url && <span className="ml-2 text-zinc-600 truncate">{post.url}</span>}
                </p>
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                disabled={deletingId === post.id}
                className="ml-4 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {deletingId === post.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
