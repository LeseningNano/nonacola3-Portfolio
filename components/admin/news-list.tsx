"use client";

import Link from "next/link";
import { useMemo, useReducer, useState } from "react";
import { ChevronDown, ExternalLink, Eye, EyeOff, FileText, MessageCircle, MoreHorizontal, Newspaper, Plus, SearchX, Trash2 } from "lucide-react";
import { adminIconActionClass, adminPrimaryActionClass } from "@/components/admin/admin-action-styles";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminStatus } from "@/components/admin/admin-status";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { formatAdminDate } from "@/lib/admin-navigation";
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
  const publishedCount = useMemo(() => state.posts.filter((post) => post.published).length, [state.posts]);
  const draftCount = state.posts.length - publishedCount;

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

  function clearFilters() {
    setFilter("all");
    setQuery("");
  }

  return (
    <div className="mx-auto max-w-[75rem] space-y-4">
      <AdminPageHeader
        title="NEWS"
        subtitle="动态与文章"
        meta={`${state.posts.length} 条 · ${publishedCount} 已发布 · ${draftCount} 草稿`}
        actions={(
          <Menu>
            <MenuTrigger className={adminPrimaryActionClass}>
              <Plus aria-hidden="true" />新建<ChevronDown aria-hidden="true" />
            </MenuTrigger>
            <MenuContent>
              <MenuLinkItem href="/dashboard/news/new?type=short">
                <MessageCircle aria-hidden="true" className="size-3.5 text-admin-fg-3" />短动态
              </MenuLinkItem>
              <MenuLinkItem href="/dashboard/news/new?type=article">
                <FileText aria-hidden="true" className="size-3.5 text-admin-fg-3" />Markdown 文章
              </MenuLinkItem>
            </MenuContent>
          </Menu>
        )}
      />

      <AdminToolbar
        filters={(
          <AdminFilterGroup<NewsFilter>
            label="内容筛选"
            value={filter}
            options={[
              { value: "all", label: "全部", count: state.posts.length },
              { value: "published", label: "已发布", count: publishedCount },
              { value: "draft", label: "草稿", count: draftCount },
            ]}
            onChange={setFilter}
          />
        )}
        search={<AdminSearch id="news-search" label="搜索内容" placeholder="搜索标题或正文" value={query} onChange={setQuery} />}
      />

      {state.posts.length === 0 ? (
        <AdminEmptyState
          icon={Newspaper}
          title="还没有动态或文章"
          description="发布的短动态和文章会出现在首页 News 区域。"
          action={<Link href="/dashboard/news/new?type=short" className={adminPrimaryActionClass}><Plus aria-hidden="true" />新建短动态</Link>}
        />
      ) : visiblePosts.length === 0 ? (
        <AdminEmptyState
          icon={SearchX}
          title={query.trim() ? `没有匹配「${query.trim()}」的内容` : "当前筛选下没有内容"}
          action={<Button type="button" variant="outline" size="sm" onClick={clearFilters}>清除筛选</Button>}
        />
      ) : (
        <ul aria-label="News 内容列表" className="space-y-1">
          {visiblePosts.map((post) => {
            const kind = getPostKind(post);
            const pending = state.pendingId === post.id;
            const TypeIcon = kind === "article" ? FileText : MessageCircle;
            const content = kind === "article"
              ? post.title === "" ? "未命名文章" : post.title ?? "未命名文章"
              : post.body;

            return (
              <li
                key={post.id}
                className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-sm p-2 transition-colors hover:bg-admin-raised lg:grid-cols-[2rem_minmax(0,1fr)_6rem_5rem_6.5rem_4.5rem] lg:gap-x-4"
              >
                <span className="row-span-2 grid size-8 place-items-center rounded-sm bg-admin-raised text-admin-fg-3 lg:row-span-1">
                  <TypeIcon aria-hidden="true" className="size-4" />
                  <span className="sr-only">{kind === "article" ? "文章" : "短动态"}</span>
                </span>
                <Link
                  href={`/dashboard/news/${post.id}/edit`}
                  aria-label={`编辑 ${content}`}
                  className="col-start-2 row-start-1 min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent lg:col-auto lg:row-auto"
                >
                  <span className="block truncate text-sm text-admin-fg">{content}</span>
                  {kind === "article" ? <span className="mt-0.5 block truncate text-xs text-admin-fg-3">{post.body}</span> : null}
                </Link>
                <span className="hidden min-w-0 truncate text-xs text-admin-fg-2 lg:block">{post.tag ?? "—"}</span>
                <div className="col-start-2 row-start-2 flex min-w-0 items-center gap-3 lg:col-auto lg:row-auto">
                  <AdminStatus tone={post.published ? "published" : "draft"}>{post.published ? "已发布" : "草稿"}</AdminStatus>
                  <time className="font-admin-mono text-xs text-admin-fg-3 lg:hidden" dateTime={post.createdAt}>{formatAdminDate(post.createdAt)}</time>
                </div>
                <time className="hidden font-admin-mono text-xs text-admin-fg-3 lg:block" dateTime={post.createdAt}>{formatAdminDate(post.createdAt)}</time>
                <div className="col-start-3 row-span-2 row-start-1 flex items-center justify-end gap-0.5 lg:col-auto lg:row-span-1 lg:row-auto">
                  {post.published ? (
                    <Link
                      href={kind === "article" ? `/news/${post.id}` : "/#news"}
                      target="_blank"
                      aria-label={`预览 ${content}`}
                      title="在新窗口预览"
                      className={adminIconActionClass}
                    >
                      <ExternalLink aria-hidden="true" />
                    </Link>
                  ) : null}
                  <Menu>
                    <MenuTrigger aria-label={`${content} 的更多操作`} disabled={pending} className={adminIconActionClass}>
                      <MoreHorizontal aria-hidden="true" />
                    </MenuTrigger>
                    <MenuContent>
                      <MenuItem disabled={pending} onClick={() => void changePublished(post)}>
                        {post.published ? <EyeOff aria-hidden="true" className="size-3.5" /> : <Eye aria-hidden="true" className="size-3.5" />}
                        {post.published ? "转为草稿" : "发布"}
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem
                        disabled={pending}
                        onClick={() => void deletePost(post)}
                        className="text-admin-danger data-[highlighted]:bg-admin-danger/10 data-[highlighted]:text-admin-danger"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />删除内容
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
