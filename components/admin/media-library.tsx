"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { ImageIcon, Loader2, Trash2, Video } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MediaPicker } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import {
  filterMediaFiles,
  reduceMediaLibraryState,
  type MediaFile,
  type MediaLibraryFilter,
} from "@/lib/admin-media";
import { createMediaInventoryRequestController, type InventoryRequest } from "./media-library-inventory";

type Inventory = {
  count: number;
  totalSize: number;
  totalSizeMB: string;
  files: MediaFile[];
};

const fallbackError = "操作失败，请稍后重试。";

export function MediaLibrary() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [state, dispatch] = useReducer(reduceMediaLibraryState, {
    files: [], snapshot: null, deletingUrl: null, error: null,
  });
  const [inventory, setInventory] = useState<Pick<Inventory, "count" | "totalSize" | "totalSizeMB"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<MediaLibraryFilter>("all");
  const [query, setQuery] = useState("");
  const [inventoryRequest] = useState(() => createMediaInventoryRequestController(setLoading));

  const invalidateInventoryRequests = useCallback(() => {
    inventoryRequest.invalidate();
  }, [inventoryRequest]);

  const loadInventory = useCallback(async () => {
    const request: InventoryRequest = inventoryRequest.start();
    setLoadError(null);
    try {
      const response = await fetch("/api/blob-usage", { signal: request.controller.signal });
      if (!response.ok) throw new Error(await responseError(response));
      const data = (await response.json()) as Partial<Inventory>;
      if (!Array.isArray(data.files) || typeof data.count !== "number" || typeof data.totalSizeMB !== "string") {
        throw new Error("媒体库返回了无效数据");
      }
      if (!inventoryRequest.isCurrent(request)) return;
      dispatch({ type: "replace-files", files: data.files });
      setInventory({ count: data.count, totalSize: data.totalSize ?? 0, totalSizeMB: data.totalSizeMB });
    } catch (error) {
      if (!inventoryRequest.isCurrent(request) || request.controller.signal.aborted) return;
      setLoadError(error instanceof Error ? error.message : fallbackError);
    } finally {
      inventoryRequest.finish(request);
    }
  }, [inventoryRequest]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadInventory(); }, 0);
    return () => {
      window.clearTimeout(timer);
      invalidateInventoryRequests();
    };
  }, [invalidateInventoryRequests, loadInventory]);

  const visibleFiles = useMemo(
    () => filterMediaFiles(state.files, filter, query),
    [filter, query, state.files],
  );

  async function deleteFile(file: MediaFile) {
    if (file.references.length > 0 || state.deletingUrl) return;
    const confirmed = window.confirm(`确定删除“${file.pathname}”（${file.sizeMB} MB）吗？此操作无法撤销。系统仅检查指定数据库字段中的精确托管 Blob URL；复制、改写或其他字段中的资源无法自动识别。`);
    if (!confirmed) return;

    invalidateInventoryRequests();
    dispatch({ type: "delete-start", url: file.url });
    try {
      const response = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: file.url }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      dispatch({ type: "delete-success" });
      setInventory((current) => current ? {
        ...current,
        count: Math.max(0, current.count - 1),
        totalSize: Math.max(0, current.totalSize - file.size),
        totalSizeMB: (Math.max(0, current.totalSize - file.size) / (1024 * 1024)).toFixed(2),
      } : current);
      toastSuccess("媒体已删除");
      setSuccessMessage(`媒体已删除：${file.pathname}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : fallbackError;
      dispatch({ type: "delete-error", message });
      toastError(message);
    }
  }

  function onMediaSelected() {
    void loadInventory();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="媒体库"
        description="管理已上传媒体；仅未被引用的文件可以删除。"
        status={<span className="text-sm text-neutral-400">{inventory ? `${inventory.count} 个文件 · ${inventory.totalSizeMB} MB` : "正在读取存储信息…"}</span>}
        actions={<div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => void loadInventory()} disabled={Boolean(state.deletingUrl) || loading}>刷新媒体库</Button><MediaPicker kind="image" value="" onSelect={onMediaSelected} label="上传图片" disabled={Boolean(state.deletingUrl)} /><MediaPicker kind="video" value="" onSelect={onMediaSelected} label="上传视频" disabled={Boolean(state.deletingUrl)} /></div>}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="媒体筛选">
          {(["all", "image", "video", "unused"] as const).map((option) => (
            <Button key={option} type="button" size="sm" variant={filter === option ? "secondary" : "outline"} onClick={() => setFilter(option)} aria-pressed={filter === option}>
              {{ all: "全部", image: "图片", video: "视频", unused: "未使用" }[option]}
            </Button>
          ))}
        </div>
        <div className="w-full sm:w-72">
          <label htmlFor="media-search" className="sr-only">按文件名搜索</label>
          <input id="media-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="按文件名搜索" className="h-8 w-full rounded-lg border border-white/15 bg-white/5 px-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white/40 focus:outline-none" />
        </div>
      </div>

      {state.deletingUrl ? <p role="status" aria-live="polite" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200">正在删除媒体，完成前不能刷新媒体库。</p> : null}
      {successMessage ? <p role="status" aria-live="polite" className="sr-only">{successMessage}</p> : null}
      {state.error ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200"><p role="alert">删除未完成，文件已恢复：{state.error}</p>{state.retryFile ? <Button type="button" size="sm" variant="outline" onClick={() => void deleteFile(state.retryFile!)}>重新尝试删除 {state.retryFile.pathname}</Button> : null}</div> : null}
      {loading ? <div role="status" aria-live="polite" className="flex justify-center gap-2 py-16 text-sm text-neutral-400"><Loader2 className="animate-spin" />正在加载媒体库…</div> : null}
      {!loading && loadError ? <div className="space-y-3 rounded-xl border border-red-400/30 px-5 py-12 text-center"><p role="alert" className="text-sm text-red-200">{loadError}</p><Button type="button" variant="outline" onClick={() => void loadInventory()}>重试</Button></div> : null}
      {!loading && !loadError && state.files.length === 0 ? <EmptyState /> : null}
      {!loading && !loadError && state.files.length > 0 && visibleFiles.length === 0 ? <p className="rounded-xl border border-dashed border-white/15 px-5 py-12 text-center text-sm text-neutral-400">没有符合当前筛选条件的媒体。</p> : null}
      {!loading && !loadError && visibleFiles.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleFiles.map((file) => <MediaCard key={file.url} file={file} deleting={state.deletingUrl === file.url} onDelete={deleteFile} />)}</div> : null}
    </div>
  );
}

function EmptyState() {
  return <p className="rounded-xl border border-dashed border-white/15 px-5 py-12 text-center text-sm text-neutral-400">媒体库还没有文件。上传图片或视频后会显示在这里。</p>;
}

function MediaCard({ file, deleting, onDelete }: { file: MediaFile; deleting: boolean; onDelete: (file: MediaFile) => void }) {
  const isImage = /\.(jpe?g|png|webp|gif|avif|svg)(?:[?#]|$)/i.test(file.pathname);
  const referenced = file.references.length > 0;
  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="relative aspect-video bg-neutral-900">
        {isImage ? (
          // Blob media is user-managed and may use arbitrary public hosts.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.url} alt="" className="h-full w-full object-cover" />
        ) : <video src={file.url} className="h-full w-full object-cover" muted preload="metadata" />}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white">{isImage ? <ImageIcon className="size-3" /> : <Video className="size-3" />}{isImage ? "图片" : "视频"}</span>
      </div>
      <div className="space-y-3 p-4">
        <div><p className="truncate text-sm font-medium text-white" title={file.pathname}>{file.pathname}</p><p className="mt-1 text-xs text-neutral-500">{file.sizeMB} MB</p></div>
        {referenced ? <div className="space-y-1"><p className="text-xs text-neutral-500">正在使用于</p>{file.references.map((reference) => <p key={`${reference.kind}-${reference.id}-${reference.field}`} className="text-xs text-amber-200">{reference.label} · {reference.field}</p>)}</div> : <div className="flex items-center justify-between gap-3"><span className="text-xs text-emerald-200">未使用</span><Button type="button" size="sm" variant="outline" disabled={deleting} onClick={() => void onDelete(file)} aria-label={`删除 ${file.pathname}`} className="text-red-200 hover:text-red-100">{deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} {deleting ? "删除中" : "删除"}</Button></div>}
      </div>
    </article>
  );
}

async function responseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === "string" && payload.error ? payload.error : fallbackError;
  } catch {
    return fallbackError;
  }
}
