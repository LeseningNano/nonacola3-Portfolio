"use client";

import Link from "next/link";
import { useMemo, useReducer, useState } from "react";
import { ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import {
  filterAdminPosts,
  getPostKind,
  reduceNewsListState,
  type NewsFilter,
} from "@/lib/admin-news";
import type { PostItem } from "@/lib/types";

const fallbackError = "操作失败，请稍后重试。";

export function NewsList({ initialPosts }: { initialPosts: PostItem[] }) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [state, dispatch] = useReducer(reduceNewsListState, {
    posts: initialPosts,
    snapshot: null,
    pendingId: null,
  });
  const [filter, setFilter] = useState<NewsFilter>("all");
  const [query, setQuery] = useState("");
  const visiblePosts = useMemo(
    () => filterAdminPosts(state.posts, filter, query),
    [filter, query, state.posts],
  );

  async function changePublished(post: PostItem) {
    if (state.pendingId) return;
    const published = !post.published;
    dispatch({ type: "toggle-start", id: post.id });

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          body: post.body,
          tag: post.tag,
          published,
        }),
      });
      if (!response.ok) throw new Error(await getResponseError(response));
      dispatch({ type: "mutation-success" });
      toastSuccess(published ? "已发布" : "已转为草稿");
    } catch (error) {
      dispatch({ type: "mutation-error" });
      toastError(error instanceof Error ? error.message : fallbackError);
    }
  }

  async function deletePost(post: PostItem) {
    if (state.pendingId || !window.confirm("确定删除这条内容吗？此操作无法撤销。")) return;
    dispatch({ type: "remove-start", id: post.id });

    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await getResponseError(response));
      dispatch({ type: "mutation-success" });
      toastSuccess("已删除");
    } catch (error) {
      dispatch({ type: "mutation-error" });
      toastError(error instanceof Error ? error.message : fallbackError);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="内容"
        status={<span className="text-sm text-neutral-400">{state.posts.length} 条内容</span>}
        actions={
          <details className="relative">
            <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium text-black hover:bg-neutral-200 [&::-webkit-details-marker]:hidden"><Plus className="size-3.5" />新建内容</summary>
            <div className="absolute right-0 z-10 mt-2 w-36 rounded-lg border border-white/10 bg-neutral-900 p-1 shadow-xl">
              <Link href="/dashboard/news/new?type=short" className="block rounded px-2 py-1.5 text-sm text-neutral-200 hover:bg-white/10">短动态</Link>
              <Link href="/dashboard/news/new?type=article" className="block rounded px-2 py-1.5 text-sm text-neutral-200 hover:bg-white/10">文章</Link>
            </div>
          </details>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2" aria-label="内容筛选">
          {(["all", "published", "draft"] as const).map((option) => (
            <Button key={option} type="button" size="sm" variant={filter === option ? "secondary" : "outline"} onClick={() => setFilter(option)} aria-pressed={filter === option}>
              {option === "all" ? "全部" : option === "published" ? "已发布" : "草稿"}
            </Button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <label htmlFor="news-search" className="sr-only">搜索内容</label>
          <input id="news-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或正文" className="h-8 w-full rounded-lg border border-white/15 bg-white/5 px-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white/40 focus:outline-none" />
        </div>
      </div>

      {state.posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-5 py-12 text-center"><p className="text-sm text-neutral-300">还没有内容。</p><Link href="/dashboard/news/new?type=short" className="mt-3 inline-block text-sm text-white underline underline-offset-4">新建第一条内容</Link></div>
      ) : visiblePosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-5 py-12 text-center text-sm text-neutral-400">没有符合当前筛选条件的内容。</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-medium text-neutral-400"><tr><th className="px-4 py-3">类型</th><th className="px-4 py-3">内容</th><th className="px-4 py-3">标签</th><th className="px-4 py-3">创建日期</th><th className="px-4 py-3">状态</th><th className="px-4 py-3"><span className="sr-only">操作</span></th></tr></thead>
            <tbody>{visiblePosts.map((post) => {
              const kind = getPostKind(post);
              const pending = state.pendingId === post.id;
              const content = kind === "article"
                ? post.title === "" ? "未命名文章" : post.title ?? "未命名文章"
                : post.body;
              return (
                <tr key={post.id} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3 text-neutral-400">{kind === "article" ? "文章" : "短动态"}</td>
                  <td className="max-w-96 px-4 py-3"><p className="truncate font-medium text-white">{content}</p>{kind === "article" ? <p className="mt-1 truncate text-xs text-neutral-500">{post.body}</p> : null}</td>
                  <td className="px-4 py-3 text-neutral-400">{post.tag ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-400"><time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</time></td>
                  <td className="px-4 py-3"><span className={post.published ? "text-emerald-200" : "text-amber-200"}>{post.published ? "已发布" : "草稿"}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                    {post.published ? <Link href={kind === "article" ? `/news/${post.id}` : "/#news"} target="_blank" className="inline-flex size-7 items-center justify-center rounded text-neutral-300 hover:bg-white/10 hover:text-white" aria-label={`预览 ${content}`}><ExternalLink className="size-3.5" /></Link> : null}
                    <Link href={`/dashboard/news/${post.id}/edit`} className="inline-flex size-7 items-center justify-center rounded text-neutral-300 hover:bg-white/10 hover:text-white" aria-label={`编辑 ${content}`}><Pencil className="size-3.5" /></Link>
                    <button type="button" disabled={pending} onClick={() => void changePublished(post)} className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-neutral-300 hover:bg-white/10 hover:text-white disabled:opacity-50" aria-label={post.published ? `取消发布 ${content}` : `发布 ${content}`}>{post.published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{post.published ? "取消发布" : "发布"}</button>
                    <button type="button" disabled={pending} onClick={() => void deletePost(post)} className="inline-flex size-7 items-center justify-center rounded text-red-300 hover:bg-red-400/10 disabled:opacity-50" aria-label={`删除 ${content}`}><Trash2 className="size-3.5" /></button>
                  </div></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

async function getResponseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === "string" && payload.error ? payload.error : fallbackError;
  } catch {
    return fallbackError;
  }
}
