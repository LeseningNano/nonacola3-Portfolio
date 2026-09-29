"use client";

/* eslint-disable @next/next/no-img-element -- Thumbnail URLs come from the existing arbitrary-host video record field. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDownUp, ExternalLink, Film, MoreHorizontal, Plus, SearchX, Trash2 } from "lucide-react";
import { adminIconActionClass, adminPrimaryActionClass, adminSecondaryActionClass } from "@/components/admin/admin-action-styles";
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
import { filterAdminWorks } from "@/lib/admin-works";
import type { Video } from "@/lib/types";

type WorksFilter = "all" | "featured";

export function WorksList({ initialWorks }: { initialWorks: Video[] }) {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [works, setWorks] = useState(initialWorks);
  const [query, setQuery] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const visibleWorks = useMemo(() => filterAdminWorks(works, query, featuredOnly), [featuredOnly, query, works]);
  const featuredCount = useMemo(() => works.filter((work) => work.featured).length, [works]);

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

  function clearFilters() {
    setQuery("");
    setFeaturedOnly(false);
  }

  const newWorkLink = (
    <Link href="/dashboard/works/new" className={adminPrimaryActionClass}>
      <Plus aria-hidden="true" />新建作品
    </Link>
  );

  return (
    <div className="mx-auto max-w-[75rem] space-y-4">
      <AdminPageHeader
        title="WORKS"
        subtitle="作品"
        meta={`${works.length} 个作品 · ${featuredCount} 个精选`}
        actions={newWorkLink}
      />
      <AdminToolbar
        filters={(
          <AdminFilterGroup<WorksFilter>
            label="作品筛选"
            value={featuredOnly ? "featured" : "all"}
            options={[
              { value: "all", label: "全部", count: works.length },
              { value: "featured", label: "精选", count: featuredCount },
            ]}
            onChange={(value) => setFeaturedOnly(value === "featured")}
          />
        )}
        search={<AdminSearch id="works-search" label="搜索作品" placeholder="搜索标题或分类" value={query} onChange={setQuery} />}
        actions={(
          <Link href="/dashboard/works/order" className={adminSecondaryActionClass}>
            <ArrowDownUp aria-hidden="true" />调整顺序
          </Link>
        )}
      />
      {works.length === 0 ? (
        <AdminEmptyState icon={Film} title="还没有作品" description="新建第一个作品后，它会出现在这里。" action={newWorkLink} />
      ) : visibleWorks.length === 0 ? (
        <AdminEmptyState
          icon={SearchX}
          title={query.trim() ? `没有匹配「${query.trim()}」的作品` : "还没有精选作品"}
          action={<Button type="button" variant="outline" size="sm" onClick={clearFilters}>清除筛选</Button>}
        />
      ) : (
        <ul className="space-y-1">
          {visibleWorks.map((work) => {
            const meta = [work.category, work.role, work.tools].filter(Boolean).join(" · ");
            const isDeleting = deletingId === work.id;

            return (
              <li
                key={work.id}
                data-admin-work-row
                className="group grid min-w-0 grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-sm p-2 transition-colors hover:bg-admin-raised sm:grid-cols-[7rem_minmax(0,1fr)_auto] lg:grid-cols-[7rem_minmax(0,1fr)_5.5rem_6.5rem_auto] lg:gap-x-4"
              >
                <Link
                  href={`/dashboard/works/${work.id}/edit`}
                  aria-label={`编辑 ${work.title}`}
                  tabIndex={-1}
                  className="row-span-2 block aspect-video w-[6rem] overflow-hidden rounded-[3px] bg-admin-raised sm:w-[7rem] lg:row-span-1"
                >
                  {work.thumbnail
                    ? <img src={work.thumbnail} alt="" className="size-full object-cover" />
                    : <span className="grid size-full place-items-center"><Film aria-hidden="true" className="size-5 text-admin-fg-3" /></span>}
                </Link>
                <Link
                  href={`/dashboard/works/${work.id}/edit`}
                  className="col-start-2 row-start-1 min-w-0 self-end rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent lg:col-auto lg:row-auto lg:self-center"
                >
                  <span className="block truncate text-sm text-admin-fg">{work.title}</span>
                  {meta ? <span className="mt-1 block truncate font-admin-mono text-xs text-admin-fg-3">{meta}</span> : null}
                </Link>
                <div className="col-start-2 row-start-2 self-start lg:col-auto lg:row-auto lg:self-center">
                  <AdminStatus tone={work.featured ? "featured" : "ordinary"}>{work.featured ? "精选" : "普通"}</AdminStatus>
                </div>
                <time className="hidden font-admin-mono text-xs text-admin-fg-3 lg:block" dateTime={work.updatedAt} title="最后更新">
                  {formatAdminDate(work.updatedAt)}
                </time>
                <div className="col-start-3 row-span-2 row-start-1 flex items-center justify-end gap-0.5 lg:col-auto lg:row-span-1 lg:row-auto">
                  <Link
                    href={`/works/${work.id}`}
                    target="_blank"
                    aria-label={`预览 ${work.title}`}
                    title="在新窗口预览"
                    className={`hidden sm:inline-flex ${adminIconActionClass}`}
                  >
                    <ExternalLink aria-hidden="true" />
                  </Link>
                  <Menu>
                    <MenuTrigger aria-label={`${work.title} 的更多操作`} disabled={isDeleting} className={adminIconActionClass}>
                      <MoreHorizontal aria-hidden="true" />
                    </MenuTrigger>
                    <MenuContent>
                      <MenuLinkItem href={`/works/${work.id}`} target="_blank" className="sm:hidden">
                        <ExternalLink aria-hidden="true" className="size-3.5" />在新窗口预览
                      </MenuLinkItem>
                      <MenuSeparator className="sm:hidden" />
                      <MenuItem
                        disabled={isDeleting}
                        onClick={() => void deleteWork(work.id)}
                        className="text-admin-danger data-[highlighted]:bg-admin-danger/10 data-[highlighted]:text-admin-danger"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
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
