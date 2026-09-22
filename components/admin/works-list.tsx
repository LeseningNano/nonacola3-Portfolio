"use client";

/* eslint-disable @next/next/no-img-element -- Thumbnail URLs come from the existing arbitrary-host video record field. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, MoreHorizontal, SlidersHorizontal, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { filterAdminWorks } from "@/lib/admin-works";
import type { Video } from "@/lib/types";

export function WorksList({ initialWorks }: { initialWorks: Video[] }) {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [works, setWorks] = useState(initialWorks);
  const [query, setQuery] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const visibleWorks = useMemo(() => filterAdminWorks(works, query, featuredOnly), [featuredOnly, query, works]);

  async function deleteWork(id: string) {
    if (!window.confirm("确定删除这个作品吗？此操作无法撤销。")) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败");
      setWorks((current) => current.filter((work) => work.id !== id));
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="作品"
        status={<span className="text-sm text-neutral-400">{works.length} 个作品</span>}
        actions={<Link href="/dashboard/works/new" className="inline-flex h-8 items-center rounded-lg bg-white px-3 text-sm font-medium text-black transition-colors hover:bg-neutral-200">新建作品</Link>}
      />
      <AdminToolbar
        filters={(
          <div className="flex items-center gap-1.5" role="group" aria-label="作品筛选">
            <Button type="button" size="sm" variant={featuredOnly ? "outline" : "secondary"} onClick={() => setFeaturedOnly(false)} aria-pressed={!featuredOnly}>全部</Button>
            <Button type="button" size="sm" variant={featuredOnly ? "secondary" : "outline"} onClick={() => setFeaturedOnly(true)} aria-pressed={featuredOnly}>精选</Button>
          </div>
        )}
        search={(
          <>
            <label htmlFor="works-search" className="sr-only">搜索作品</label>
            <input id="works-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或分类" className="h-8 w-full min-w-0 rounded-lg border border-white/15 bg-white/5 px-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40" />
          </>
        )}
        actions={<Link href="/dashboard/works/order" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-sm text-neutral-200 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><SlidersHorizontal aria-hidden="true" className="size-3.5" />调整顺序</Link>}
      />
      {works.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 px-5 py-10 text-center"><p className="text-sm text-neutral-300">还没有作品。</p><Link href="/dashboard/works/new" className="mt-3 inline-block text-sm text-white underline underline-offset-4">新建第一个作品</Link></div>
      ) : visibleWorks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 px-5 py-10 text-center text-sm text-neutral-400">没有符合当前筛选条件的作品。</div>
      ) : (
        <ul className="divide-y divide-white/10 border-y border-white/10">
          {visibleWorks.map((work) => {
            const roleAndTools = [work.role, work.tools].filter(Boolean).join(" · ") || work.category;
            const isDeleting = deletingId === work.id;

            return (
              <li
                key={work.id}
                data-admin-work-row
                className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 lg:grid-cols-[4.5rem_minmax(0,2fr)_minmax(0,1fr)_auto_minmax(7rem,auto)_auto] lg:gap-x-4"
              >
                <Link
                  href={`/dashboard/works/${work.id}/edit`}
                  aria-label={`编辑 ${work.title}`}
                  className="row-span-2 block aspect-video w-16 overflow-hidden rounded-md bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:row-span-1 lg:w-[4.5rem]"
                >
                  {work.thumbnail ? <img src={work.thumbnail} alt="" className="size-full object-cover" /> : <span aria-hidden="true" className="block size-full bg-white/[0.04]" />}
                </Link>
                <Link href={`/dashboard/works/${work.id}/edit`} className="col-start-2 row-start-1 min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:col-auto lg:row-auto">
                  <span className="block truncate text-sm font-medium text-white">{work.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-neutral-500">{roleAndTools}</span>
                </Link>
                <span className="hidden min-w-0 truncate text-sm text-neutral-300 lg:block">{work.category}</span>
                <div className="col-start-2 row-start-2 lg:col-auto lg:row-auto">
                  <AdminStatusBadge tone={work.featured ? "featured" : "neutral"}>{work.featured ? "精选" : "普通"}</AdminStatusBadge>
                </div>
                <time className="hidden text-sm tabular-nums text-neutral-400 lg:block" dateTime={work.updatedAt}>{new Date(work.updatedAt).toLocaleDateString("zh-CN")}</time>
                <div className="col-start-3 row-span-2 row-start-1 flex items-center justify-end gap-1 lg:col-auto lg:row-span-1 lg:row-auto">
                  <Link href={`/works/${work.id}`} target="_blank" className="inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-xs text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label={`预览 ${work.title}`}>
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                    <span>预览</span>
                  </Link>
                  <Menu>
                    <MenuTrigger aria-label={`${work.title} 的更多操作`} disabled={isDeleting} className="inline-flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50">
                      <MoreHorizontal aria-hidden="true" className="size-4" />
                    </MenuTrigger>
                    <MenuContent>
                      <MenuItem disabled={isDeleting} onClick={() => void deleteWork(work.id)} className="text-red-300 data-[highlighted]:bg-red-400/10 data-[highlighted]:text-red-200">
                        <Trash2 aria-hidden="true" className="mr-2 size-3.5" />
                        {isDeleting ? "删除中…" : "删除作品"}
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
