"use client";

/* eslint-disable @next/next/no-img-element -- Thumbnail URLs come from the existing arbitrary-host video record field. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, MoreHorizontal, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
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
    <div className="space-y-6">
      <AdminPageHeader
        title="作品"
        status={<span className="text-sm text-neutral-400">{works.length} 个作品</span>}
        actions={<Link href="/dashboard/works/new" className="inline-flex h-8 items-center rounded-lg bg-white px-3 text-sm font-medium text-black hover:bg-neutral-200">新建作品</Link>}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2" aria-label="作品筛选">
          <Button type="button" size="sm" variant={featuredOnly ? "outline" : "secondary"} onClick={() => setFeaturedOnly(false)} aria-pressed={!featuredOnly}>全部</Button>
          <Button type="button" size="sm" variant={featuredOnly ? "secondary" : "outline"} onClick={() => setFeaturedOnly(true)} aria-pressed={featuredOnly}>精选</Button>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label htmlFor="works-search" className="sr-only">搜索作品</label>
          <input id="works-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或分类" className="h-8 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white/40 focus:outline-none sm:w-64" />
          <Link href="/dashboard/works/order" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-sm text-neutral-200 hover:bg-white/10"><SlidersHorizontal className="size-3.5" />排序</Link>
        </div>
      </div>
      {works.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-5 py-12 text-center"><p className="text-sm text-neutral-300">还没有作品。</p><Link href="/dashboard/works/new" className="mt-3 inline-block text-sm text-white underline underline-offset-4">新建第一个作品</Link></div>
      ) : visibleWorks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-5 py-12 text-center text-sm text-neutral-400">没有符合当前筛选条件的作品。</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs font-medium text-neutral-400"><tr><th className="px-4 py-3">排序</th><th className="px-4 py-3">封面</th><th className="px-4 py-3">作品</th><th className="px-4 py-3">分类</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">更新于</th><th className="px-4 py-3"><span className="sr-only">操作</span></th></tr></thead>
            <tbody>{visibleWorks.map((work) => (
              <tr key={work.id} className="border-b border-white/10 last:border-0">
                <td className="px-4 py-3 tabular-nums text-neutral-400">{work.order}</td>
                <td className="px-4 py-3">{work.thumbnail ? <img src={work.thumbnail} alt="" className="h-10 w-16 rounded object-cover" /> : <div className="h-10 w-16 rounded bg-white/10" aria-label="无封面" />}</td>
                <td className="max-w-64 px-4 py-3 font-medium text-white">{work.title}</td><td className="px-4 py-3 text-neutral-300">{work.category}</td>
                <td className="px-4 py-3"><span className={work.featured ? "text-amber-200" : "text-neutral-500"}>{work.featured ? "精选" : "普通"}</span></td>
                <td className="px-4 py-3 text-neutral-400"><time dateTime={work.updatedAt}>{new Date(work.updatedAt).toLocaleDateString("zh-CN")}</time></td>
                <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                  <Link href={`/works/${work.id}`} target="_blank" className="inline-flex size-7 items-center justify-center rounded text-neutral-300 hover:bg-white/10 hover:text-white" aria-label={`预览 ${work.title}`}><ExternalLink className="size-3.5" /></Link>
                  <Link href={`/dashboard/works/${work.id}/edit`} className="inline-flex size-7 items-center justify-center rounded text-neutral-300 hover:bg-white/10 hover:text-white" aria-label={`编辑 ${work.title}`}><Pencil className="size-3.5" /></Link>
                  <details className="relative"><summary className="flex size-7 cursor-pointer list-none items-center justify-center rounded text-neutral-300 hover:bg-white/10 hover:text-white [&::-webkit-details-marker]:hidden" aria-label={`${work.title} 的更多操作`}><MoreHorizontal className="size-4" /></summary><div className="absolute right-0 z-10 mt-1 w-28 rounded-lg border border-white/10 bg-neutral-900 p-1 shadow-xl"><button type="button" onClick={() => deleteWork(work.id)} disabled={deletingId === work.id} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-50"><Trash2 className="size-3.5" />{deletingId === work.id ? "删除中" : "删除"}</button></div></details>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
