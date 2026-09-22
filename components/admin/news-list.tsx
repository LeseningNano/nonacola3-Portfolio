"use client";

import Link from "next/link";
import { useMemo, useReducer, useState } from "react";
import { ChevronDown, ExternalLink, Eye, EyeOff, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
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
    <div className="space-y-5">
      <AdminPageHeader
        title="内容"
        status={<span className="text-sm text-neutral-400">{state.posts.length} 条内容</span>}
        actions={(
          <Menu>
            <MenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium text-black transition-colors hover:bg-neutral-200">
              <Plus aria-hidden="true" className="size-3.5" />新建内容<ChevronDown aria-hidden="true" className="size-3.5" />
            </MenuTrigger>
            <MenuContent>
              <MenuLinkItem href="/dashboard/news/new?type=short">短动态</MenuLinkItem>
              <MenuLinkItem href="/dashboard/news/new?type=article">Markdown 文章</MenuLinkItem>
            </MenuContent>
          </Menu>
        )}
      />

      <AdminToolbar
        filters={(
          <div className="flex items-center gap-1.5" role="group" aria-label="内容筛选">
            {(["all", "published", "draft"] as const).map((option) => (
              <Button key={option} type="button" size="sm" variant={filter === option ? "secondary" : "outline"} onClick={() => setFilter(option)} aria-pressed={filter === option}>
                {option === "all" ? "全部" : option === "published" ? "已发布" : "草稿"}
              </Button>
            ))}
          </div>
        )}
        search={(
          <>
            <label htmlFor="news-search" className="sr-only">搜索内容</label>
            <input id="news-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或正文" className="h-8 w-full min-w-0 rounded-lg border border-white/15 bg-white/5 px-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40" />
          </>
        )}
      />

      {state.posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 px-5 py-10 text-center"><p className="text-sm text-neutral-300">还没有内容。</p><Link href="/dashboard/news/new?type=short" className="mt-3 inline-block text-sm text-white underline underline-offset-4">新建第一条内容</Link></div>
      ) : visiblePosts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 px-5 py-10 text-center text-sm text-neutral-400">没有符合当前筛选条件的内容。</div>
      ) : (
        <ul aria-label="News 内容列表" className="divide-y divide-white/10 border-y border-white/10">
          {visiblePosts.map((post) => {
            const kind = getPostKind(post);
            const pending = state.pendingId === post.id;
            const content = kind === "article"
              ? post.title === "" ? "未命名文章" : post.title ?? "未命名文章"
              : post.body;

            return (
              <li key={post.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(7rem,auto)_auto_auto_auto] lg:gap-x-4">
                <Link href={`/dashboard/news/${post.id}/edit`} aria-label={`编辑 ${content}`} className="col-start-1 row-start-1 min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:col-auto lg:row-auto">
                  <span className="block truncate text-sm font-medium text-white">{content}</span>
                  {kind === "article" ? <span className="mt-0.5 block truncate text-xs text-neutral-500">{post.body}</span> : null}
                </Link>
                <span className="hidden min-w-0 truncate text-sm text-neutral-400 lg:block">{post.tag ?? "—"}</span>
                <time className="hidden whitespace-nowrap text-sm tabular-nums text-neutral-400 lg:block" dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</time>
                <div className="col-start-1 row-start-2 flex items-center gap-2 lg:contents">
                  <span className="lg:col-auto lg:row-auto"><AdminStatusBadge tone="neutral">{kind === "article" ? "文章" : "短动态"}</AdminStatusBadge></span>
                  <span className="lg:col-auto lg:row-auto"><AdminStatusBadge tone={post.published ? "published" : "draft"}>{post.published ? "已发布" : "草稿"}</AdminStatusBadge></span>
                </div>
                <div className="col-start-2 row-span-2 row-start-1 flex items-center justify-end gap-1 lg:col-auto lg:row-span-1 lg:row-auto">
                  {post.published ? (
                    <Link href={kind === "article" ? `/news/${post.id}` : "/#news"} target="_blank" className="inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label={`预览 ${content}`}>
                      <ExternalLink aria-hidden="true" className="size-3.5" />预览
                    </Link>
                  ) : null}
                  <Menu>
                    <MenuTrigger aria-label={`${content} 的更多操作`} disabled={pending} className="inline-flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50">
                      <MoreHorizontal aria-hidden="true" className="size-4" />
                    </MenuTrigger>
                    <MenuContent>
                      <MenuItem disabled={pending} onClick={() => void changePublished(post)}>
                        {post.published ? <EyeOff aria-hidden="true" className="mr-2 size-3.5" /> : <Eye aria-hidden="true" className="mr-2 size-3.5" />}
                        {post.published ? "转为草稿" : "发布"}
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem disabled={pending} onClick={() => void deletePost(post)} className="text-red-300 data-[highlighted]:bg-red-400/10 data-[highlighted]:text-red-200">
                        <Trash2 aria-hidden="true" className="mr-2 size-3.5" />删除内容
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                </div>
              </li>
            );
          })}
        </ul>
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
