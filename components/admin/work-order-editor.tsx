"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Save } from "lucide-react";
import { useAdminNavigationGuard } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import {
  reduceOrderState,
  type ReorderItem,
  type WorkOrderState,
} from "@/lib/admin-works";
import type { Video } from "@/lib/types";

type OrderHistory = {
  state: unknown;
  replaceState: (data: unknown, unused: string, url?: string | URL | null) => void;
  pushState: (data: unknown, unused: string, url?: string | URL | null) => void;
  back: () => void;
  forward: () => void;
};

type PopstateTarget = {
  addEventListener: (type: "popstate", listener: () => void) => void;
  removeEventListener: (type: "popstate", listener: () => void) => void;
};

let nextHistoryGuardId = 1;

export function installUnsavedOrderHistoryGuard({
  history,
  target,
  href,
  confirmLeave,
}: {
  history: OrderHistory;
  target: PopstateTarget;
  href: string;
  confirmLeave: () => boolean;
}) {
  const originalState = history.state;
  const state = originalState && typeof originalState === "object" ? originalState : {};
  const guardId = nextHistoryGuardId++;
  const baseState = { ...state, __workOrderGuardId: guardId, __workOrderGuardPosition: "base" };
  const topState = { ...state, __workOrderGuardId: guardId, __workOrderGuardPosition: "top" };
  let leaving = false;

  history.replaceState(baseState, "", href);
  history.pushState(topState, "", href);

  const handlePopstate = () => {
    const current = history.state as Record<string, unknown> | null;
    if (current?.__workOrderGuardId !== guardId || current.__workOrderGuardPosition !== "base") return;

    if (confirmLeave()) {
      leaving = true;
      history.back();
    } else {
      history.forward();
    }
  };

  target.addEventListener("popstate", handlePopstate);

  return () => {
    target.removeEventListener("popstate", handlePopstate);
    const current = history.state as Record<string, unknown> | null;
    if (leaving || current?.__workOrderGuardId !== guardId || current.__workOrderGuardPosition !== "top") return;

    const restoreOriginalEntry = () => {
      target.removeEventListener("popstate", restoreOriginalEntry);
      history.replaceState(originalState, "", href);
    };
    target.addEventListener("popstate", restoreOriginalEntry);
    history.back();
  };
}

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

  useAdminNavigationGuard(confirmNavigation);

  useEffect(() => {
    if (!isDirty) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const removeHistoryGuard = installUnsavedOrderHistoryGuard({
      history: window.history,
      target: window,
      href: window.location.href,
      confirmLeave: confirmNavigation,
    });

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      removeHistoryGuard();
    };
  }, [confirmNavigation, isDirty]);

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
    return (
      <div className="rounded-xl border border-dashed border-white/15 px-5 py-12 text-center text-sm text-neutral-400">
        还没有可排序的作品。
      </div>
    );
  }

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      {state.error ? (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}。你的更改仍保留，可以重试保存。
        </p>
      ) : null}

      <ol className={isDirty ? "space-y-2 pb-24" : "space-y-2"}>
        {state.items.map((item, index) => {
          const work = worksById.get(item.id);
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
                  className={`absolute right-0 left-0 h-1 rounded-full bg-white ${
                    draggingIndex !== null && draggingIndex < index ? "-bottom-1.5" : "-top-1.5"
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto]">
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
                  aria-label={`拖动 ${work?.title ?? item.id} 调整排序`}
                  className="hidden size-8 cursor-grab items-center justify-center rounded text-neutral-400 hover:bg-white/10 hover:text-white active:cursor-grabbing disabled:opacity-50 sm:inline-flex"
                >
                  <GripVertical className="size-4" />
                </button>

                <span className="w-8 text-center text-sm tabular-nums text-neutral-400" aria-label={`当前排序 ${item.order}`}>
                  {item.order}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{work?.title ?? item.id}</p>
                  <p className="truncate text-xs text-neutral-500">{work?.category ?? "未分类"}</p>
                </div>

                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input
                    type="checkbox"
                    checked={item.featured}
                    disabled={saving}
                    onChange={(event) => dispatch({ type: "featured", index, featured: event.target.checked })}
                    className="size-4 accent-white"
                  />
                  精选
                </label>

                <div className="col-span-4 flex justify-end gap-1 sm:col-span-1">
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
        <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-white/10 bg-neutral-950/95 px-4 py-3 backdrop-blur md:left-[var(--admin-sidebar-width)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="text-sm text-neutral-400">排序或精选状态有尚未保存的更改</p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={saving} onClick={() => dispatch({ type: "cancel" })}>
                取消
              </Button>
              <Button type="button" disabled={saving} onClick={() => void save()}>
                <Save /> {saving ? "保存中…" : state.status === "error" ? "重试保存" : "保存"}
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
