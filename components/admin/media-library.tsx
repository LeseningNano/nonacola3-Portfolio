"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { ChevronDown, ImageIcon, Images, Loader2, RefreshCw, SearchX, Trash2, Upload, Video } from "lucide-react";
import { adminIconActionClass, adminPrimaryActionClass } from "@/components/admin/admin-action-styles";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminStatus } from "@/components/admin/admin-status";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { AdminMediaSkeleton } from "@/components/admin/admin-media-skeleton";
import { useMediaUpload } from "@/components/admin/media-picker";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
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
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: unknown; references?: unknown };
        if (response.status === 409 && isMediaReferences(payload.references)) {
          const message = "文件现已被引用，不能删除。";
          dispatch({ type: "delete-conflict", message, references: payload.references });
          setFilter("all");
          toastError(message);
          return;
        }
        throw new Error(errorMessage(payload));
      }
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

  const imageUpload = useMediaUpload({ kind: "image", label: "上传图片", onUploaded: onMediaSelected });
  const videoUpload = useMediaUpload({ kind: "video", label: "上传视频", onUploaded: onMediaSelected });
  const activeUpload = imageUpload.uploading ? imageUpload : videoUpload.uploading ? videoUpload : null;
  const uploadError = imageUpload.error ?? videoUpload.error;
  const counts = {
    all: state.files.length,
    image: filterMediaFiles(state.files, "image", "").length,
    video: filterMediaFiles(state.files, "video", "").length,
    unused: filterMediaFiles(state.files, "unused", "").length,
  };

  return (
    <div className="mx-auto max-w-[75rem] space-y-4">
      {imageUpload.input}
      {videoUpload.input}
      <AdminPageHeader
        title="LIBRARY"
        subtitle="媒体库"
        meta={inventory ? `${inventory.count} 个文件 · ${inventory.totalSizeMB} MB` : "正在读取存储信息…"}
        actions={(
          <Menu>
            <MenuTrigger className={adminPrimaryActionClass} disabled={Boolean(state.deletingUrl) || Boolean(activeUpload)}>
              {activeUpload ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Upload aria-hidden="true" />}
              {activeUpload ? `上传中 ${activeUpload.progress}%` : "上传"}
              {activeUpload ? null : <ChevronDown aria-hidden="true" />}
            </MenuTrigger>
            <MenuContent>
              <MenuItem onClick={imageUpload.openFilePicker}><ImageIcon aria-hidden="true" className="size-3.5 text-admin-fg-3" />上传图片</MenuItem>
              <MenuItem onClick={videoUpload.openFilePicker}><Video aria-hidden="true" className="size-3.5 text-admin-fg-3" />上传视频</MenuItem>
            </MenuContent>
          </Menu>
        )}
      />
      {uploadError ? <p role="alert" className="text-xs text-admin-danger">{uploadError}</p> : null}

      <AdminToolbar
        filters={(
          <AdminFilterGroup<MediaLibraryFilter>
            label="媒体筛选"
            value={filter}
            options={[
              { value: "all", label: "全部", count: counts.all },
              { value: "image", label: "图片", count: counts.image },
              { value: "video", label: "视频", count: counts.video },
              { value: "unused", label: "未使用", count: counts.unused },
            ]}
            onChange={setFilter}
          />
        )}
        search={<AdminSearch id="media-search" label="按文件名搜索" placeholder="按文件名搜索" value={query} onChange={setQuery} />}
        actions={(
          <button
            type="button"
            aria-label="刷新列表"
            title="刷新列表"
            onClick={() => void loadInventory()}
            disabled={Boolean(state.deletingUrl) || loading}
            className={adminIconActionClass}
          >
            <RefreshCw aria-hidden="true" className={loading ? "animate-spin motion-reduce:animate-none" : undefined} />
          </button>
        )}
      />

      {state.deletingUrl ? <p role="status" aria-live="polite" className="rounded-sm bg-admin-panel px-3 py-2 text-sm text-admin-fg-2">正在删除媒体，完成前不能刷新媒体库。</p> : null}
      {successMessage ? <p role="status" aria-live="polite" className="sr-only">{successMessage}</p> : null}
      {state.error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-admin-danger/30 bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger">
          <p role="alert">删除未完成，文件已恢复：{state.error}</p>
          {state.retryFile ? <Button type="button" size="sm" variant="outline" onClick={() => void deleteFile(state.retryFile!)}>重新尝试删除 {state.retryFile.pathname}</Button> : null}
        </div>
      ) : null}
      {loading ? <AdminMediaSkeleton /> : null}
      {!loading && loadError ? (
        <div className="space-y-3 rounded-lg bg-admin-panel px-5 py-12 text-center">
          <p role="alert" className="text-sm text-admin-danger">{loadError}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadInventory()}>重试</Button>
        </div>
      ) : null}
      {!loading && !loadError && state.files.length === 0 ? (
        <AdminEmptyState icon={Images} title="媒体库还没有文件" description="上传图片或视频后会显示在这里。" />
      ) : null}
      {!loading && !loadError && state.files.length > 0 && visibleFiles.length === 0 ? (
        <AdminEmptyState
          icon={SearchX}
          title={query.trim() ? `没有匹配「${query.trim()}」的媒体` : "当前筛选下没有媒体"}
          action={<Button type="button" variant="outline" size="sm" onClick={() => { setFilter("all"); setQuery(""); }}>清除筛选</Button>}
        />
      ) : null}
      {!loading && !loadError && visibleFiles.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-3">
          {visibleFiles.map((file) => <MediaCard key={file.url} file={file} deleting={state.deletingUrl === file.url} onDelete={deleteFile} />)}
        </div>
      ) : null}
    </div>
  );
}

function MediaCard({ file, deleting, onDelete }: { file: MediaFile; deleting: boolean; onDelete: (file: MediaFile) => void }) {
  const isImage = /\.(jpe?g|png|webp|gif|avif|svg)(?:[?#]|$)/i.test(file.pathname);
  const referenced = file.references.length > 0;
  const referenceLabels = file.references.map((reference) => (
    reference.kind === "hero" || reference.kind === "hero-poster" || reference.kind === "showreel"
      ? reference.label
      : `${reference.label} · ${referenceFieldLabel(reference.kind)}`
  ));

  return (
    <article className="min-w-0 overflow-hidden rounded-lg bg-admin-panel">
      <div className="relative aspect-video bg-admin-raised">
        {isImage
          ? (
          // Blob media is user-managed and may use arbitrary public hosts.
          // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt="" className="h-full w-full object-cover" />
          )
          : <video src={file.url} className="h-full w-full object-cover" muted preload="metadata" />}
        <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-[3px] bg-black/70 px-1.5 text-xs text-white">
          {isImage ? <ImageIcon aria-hidden="true" className="size-3" /> : <Video aria-hidden="true" className="size-3" />}
          {isImage ? "图片" : "视频"}
        </span>
      </div>
      <div className="min-w-0 space-y-1.5 p-2.5">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <p className="min-w-0 truncate font-admin-mono text-xs text-admin-fg" title={file.pathname}>{file.pathname}</p>
          <p className="shrink-0 font-admin-mono text-xs text-admin-fg-3">{file.sizeMB} MB</p>
        </div>
        {referenced ? (
          <p className="truncate text-xs text-admin-fg-2" title={referenceLabels.join("\n")}>
            使用中 · {referenceLabels.join("、")}
          </p>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <AdminStatus tone="draft">未使用</AdminStatus>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={deleting}
              onClick={() => void onDelete(file)}
              aria-label={`删除 ${file.pathname}`}
              className="h-7 text-admin-danger hover:bg-admin-danger/10 hover:text-admin-danger"
            >
              {deleting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
              {deleting ? "删除中" : "删除"}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function referenceFieldLabel(kind: MediaFile["references"][number]["kind"]): string {
  const labels: Record<MediaFile["references"][number]["kind"], string> = {
    hero: "Hero 背景视频",
    "hero-poster": "Hero 视频封面",
    showreel: "Works Showreel",
    "work-embed": "作品视频",
    "work-thumbnail": "作品缩略图",
    "work-body": "作品详情内容",
    "post-body": "News 内容",
  };
  return labels[kind];
}

async function responseError(response: Response): Promise<string> {
  try {
    return errorMessage((await response.json()) as { error?: unknown });
  } catch {
    return fallbackError;
  }
}

function errorMessage(payload: { error?: unknown }): string {
  return typeof payload.error === "string" && payload.error ? payload.error : fallbackError;
}

function isMediaReferences(value: unknown): value is MediaFile["references"] {
  return Array.isArray(value) && value.every((reference) => (
    typeof reference === "object"
    && reference !== null
    && typeof reference.kind === "string"
    && typeof reference.id === "string"
    && typeof reference.label === "string"
    && typeof reference.field === "string"
  ));
}
