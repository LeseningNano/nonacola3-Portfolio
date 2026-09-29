"use client";

/* eslint-disable @next/next/no-img-element -- Thumbnail URLs come from the existing arbitrary-host video record field. */

import { useCallback, useMemo, useReducer, useState } from "react";
import { ArrowDown, ArrowDownUp, ArrowUp, Film, GripVertical, Save } from "lucide-react";
import { useAdminNavigationGuard } from "@/components/admin/admin-shell";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatus } from "@/components/admin/admin-status";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/toast";
import {
  reduceOrderState,
  type ReorderItem,
  type WorkOrderState,
} from "@/lib/admin-works";
import type { Video } from "@/lib/types";

export function WorkOrderEditor({ initialWorks }: { initialWorks: Video[] }) {
  const toast = useToast();
  const [announcement, setAnnouncement] = useState("");
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [state, dispatch] = useReducer(
    reduceOrderState,
    initialWorks,
    createInitialOrderState,
  );
  const worksById = useMemo(
    () => new Map(initialWorks.map((work) => [work.id, work])),
    [initialWorks],
  );
  const isDirty = useMemo(
    () => JSON.stringify(state.items) !== JSON.stringify(state.initial),
    [state.initial, state.items],
  );
  const saving = state.status === "saving";
  const confirmNavigation = useCallback(
    () => !isDirty || window.confirm("有尚未保存的排序更改，确定要离开吗？"),
    [isDirty],
  );

  useAdminNavigationGuard(confirmNavigation, isDirty);

  function move(from: number, to: number) {
    dispatch({ type: "move", from, to });
    setAnnouncement(`作品已移动到第 ${to + 1} 位`);
  }

  async function save() {
    dispatch({ type: "save-start" });
    setAnnouncement("");

    try {
      const committed = state.items.map((item) => ({ ...item }));
      const response = await fetch("/api/videos/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: committed }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "保存失败");
      dispatch({ type: "save-success", items: committed });
      setAnnouncement("作品排序已保存");
      toast.success("作品排序已保存");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "保存失败";
      dispatch({ type: "save-error", message });
      setAnnouncement(message);
      toast.error(message);
    }
  }

  function finishDrag(to: number) {
    if (draggingIndex !== null && draggingIndex !== to) move(draggingIndex, to);
    setDraggingIndex(null);
    setInsertionIndex(null);
  }

  if (state.items.length === 0) {
    return <AdminEmptyState icon={ArrowDownUp} title="还没有可排序的作品" />;
  }

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      {state.error ? (
        <p role="alert" className="rounded-sm border border-admin-danger/30 bg-admin-danger/10 px-4 py-3 text-sm text-admin-danger">
          {state.error}。你的更改仍保留，可以重试保存。
        </p>
      ) : null}

      <ol className={`space-y-1 ${isDirty ? "pb-24" : ""}`}>
        {state.items.map((item, index) => {
          const work = worksById.get(item.id);
          const title = work?.title ?? item.id;
          const insertionVisible = insertionIndex === index && draggingIndex !== index;

          return (
            <li
              key={item.id}
              onDragEnter={() => setInsertionIndex(index)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setInsertionIndex(index);
              }}
              onDrop={(event) => {
                event.preventDefault();
                finishDrag(index);
              }}
              className="relative"
            >
              {insertionVisible ? (
                <div
                  data-insertion-target="true"
                  className={`absolute right-0 left-0 h-0.5 rounded-full bg-admin-accent ${
                    draggingIndex !== null && draggingIndex < index ? "-bottom-[3px]" : "-top-[3px]"
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <div className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-sm p-2 transition-colors hover:bg-admin-raised sm:grid-cols-[auto_auto_5rem_minmax(0,1fr)_auto_auto] ${draggingIndex === index ? "opacity-50" : ""}`}>
                <button
                  type="button"
                  draggable={!saving}
                  disabled={saving}
                  onDragStart={(event) => {
                    setDraggingIndex(index);
                    setInsertionIndex(index);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", item.id);
                  }}
                  onDragEnd={() => {
                    setDraggingIndex(null);
                    setInsertionIndex(null);
                  }}
                  aria-label={`拖动 ${title} 调整排序`}
                  className="hidden size-8 cursor-grab items-center justify-center rounded-sm text-admin-fg-3 hover:bg-admin-selected hover:text-admin-fg active:cursor-grabbing disabled:opacity-50 sm:inline-flex"
                >
                  <GripVertical className="size-4" />
                </button>

                <span className="w-7 text-center font-admin-mono text-xs text-admin-fg-3" aria-label={`当前排序 ${index + 1}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="hidden aspect-video w-[5rem] overflow-hidden rounded-[3px] bg-admin-raised sm:block">
                  {work?.thumbnail
                    ? <img src={work.thumbnail} alt="" className="size-full object-cover" />
                    : <span className="grid size-full place-items-center"><Film aria-hidden="true" className="size-4 text-admin-fg-3" /></span>}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm text-admin-fg">{title}</p>
                  <p className="truncate font-admin-mono text-xs text-admin-fg-3">{work?.category ?? "未分类"}</p>
                </div>

                <label className="col-start-2 row-start-2 flex items-center gap-2 sm:col-auto sm:row-auto">
                  <Switch
                    checked={item.featured}
                    disabled={saving}
                    aria-label={`${title} 设为精选`}
                    onCheckedChange={(checked) => dispatch({ type: "featured", index, featured: checked })}
                  />
                  <AdminStatus tone={item.featured ? "featured" : "ordinary"}>{item.featured ? "精选" : "普通"}</AdminStatus>
                </label>

                <div className="col-start-3 row-span-2 row-start-1 flex justify-end gap-0.5 sm:col-auto sm:row-span-1 sm:row-auto">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={saving || index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label={`上移 ${work?.title ?? item.id}`}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={saving || index === state.items.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label={`下移 ${work?.title ?? item.id}`}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {isDirty ? (
        <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-admin-line bg-admin-panel/95 px-4 py-3 backdrop-blur md:left-[var(--admin-sidebar-width)]">
          <div className="mx-auto flex max-w-[60rem] items-center justify-between gap-4">
            <AdminStatus tone={state.status === "error" ? "error" : "dirty"}>排序有未保存的更改</AdminStatus>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={saving} onClick={() => dispatch({ type: "cancel" })}>
                取消
              </Button>
              <Button type="button" disabled={saving} onClick={() => void save()}>
                <Save /> {saving ? "保存中…" : state.status === "error" ? "重试保存排序" : "保存排序"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function createInitialOrderState(works: Video[]): WorkOrderState {
  const items: ReorderItem[] = works.map(({ id, featured }, order) => ({ id, featured, order }));
  return {
    initial: items.map((item) => ({ ...item })),
    items: items.map((item) => ({ ...item })),
    status: "clean",
    error: null,
  };
}
