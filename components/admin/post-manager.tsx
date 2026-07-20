"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil } from "lucide-react";

interface Post {
  id: string;
  title: string | null;
  body: string;
  tag: string | null;
  createdAt: string;
}

export function PostManager({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [mode, setMode] = useState<"short" | "article">("short");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setTag("");
    setMode("short");
  }

  function handleEdit(post: Post) {
    setEditingId(post.id);
    setMode(post.title ? "article" : "short");
    setTitle(post.title || "");
    setBody(post.body);
    setTag(post.tag || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePublish() {
    if (!body.trim() || saving) return;
    if (mode === "article" && !title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: mode === "article" ? title : null,
        body,
        tag: tag || null,
      };
      const res = editingId
        ? await fetch(`/api/posts/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error();
      const post = await res.json();
      if (editingId) {
        setPosts((p) => p.map((x) => (x.id === editingId ? { ...post, createdAt: post.createdAt } : x)));
      } else {
        setPosts((p) => [{ ...post, createdAt: post.createdAt }, ...p]);
      }
      resetForm();
      router.refresh();
    } catch {
      alert(editingId ? "更新失败" : "发布失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这条动态？")) return;
    const prev = posts;
    setPosts((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setPosts(prev);
      alert("删除失败");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* 发布框 */}
      <div className="border border-neutral-800 p-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("short")}
            className={`px-4 py-1.5 text-sm border transition-colors ${mode === "short" ? "border-white text-white" : "border-neutral-700 text-neutral-400 hover:text-white"}`}
          >
            短动态
          </button>
          <button
            onClick={() => setMode("article")}
            className={`px-4 py-1.5 text-sm border transition-colors ${mode === "article" ? "border-white text-white" : "border-neutral-700 text-neutral-400 hover:text-white"}`}
          >
            文章（Markdown）
          </button>
        </div>
        {mode === "article" && (
          <Input
            placeholder="文章标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-neutral-900 border-neutral-700"
          />
        )}
        <textarea
          placeholder={mode === "article" ? "正文（支持 Markdown）" : "一句话动态…"}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={mode === "article" ? 8 : 2}
          className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
        />
        <div className="flex gap-3 items-center">
          <Input
            placeholder="标签（可选，如：作品/日常/活动）"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="bg-neutral-900 border-neutral-700 max-w-xs"
          />
          <Button onClick={handlePublish} disabled={saving}>
            {saving ? "保存中…" : editingId ? "更新" : "发布"}
          </Button>
          {editingId && (
            <button
              onClick={resetForm}
              className="px-4 py-1.5 text-sm border border-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              取消编辑
            </button>
          )}
        </div>
        {editingId && (
          <p className="text-xs text-neutral-500">正在编辑一条动态，更新后点击「更新」保存。</p>
        )}
      </div>

      {/* 列表 */}
      {posts.length === 0 ? (
        <p className="text-neutral-500 text-sm">暂无动态。</p>
      ) : (
        <div className="divide-y divide-neutral-800 border border-neutral-800">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center gap-4 px-4 py-3">
              <span className="text-xs text-neutral-500 font-mono flex-shrink-0">
                {new Date(post.createdAt).toLocaleDateString("zh-CN")}
              </span>
              <span className="text-sm text-neutral-300 truncate flex-1">
                {post.title ? `【文章】${post.title}` : post.body}
              </span>
              {post.tag && (
                <span className="text-xs text-neutral-500 border border-neutral-700 px-2 py-0.5 flex-shrink-0">
                  {post.tag}
                </span>
              )}
              <button
                onClick={() => handleEdit(post)}
                aria-label="编辑动态"
                className="text-neutral-500 hover:text-white transition-colors flex-shrink-0"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                aria-label="删除动态"
                className="text-neutral-500 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
