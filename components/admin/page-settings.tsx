"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useCallback, useReducer } from "react";
import { Loader2, Save } from "lucide-react";
import { useAdminNavigationGuard } from "@/components/admin/admin-shell";
import { AdminFormSection } from "@/components/admin/admin-form-section";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatus } from "@/components/admin/admin-status";
import { MediaPicker } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSaveableSettingState,
  isSaveableSettingDirty,
  reduceSaveableSettingState,
  type SaveableSettingState,
} from "@/lib/admin-settings";
import { getEmbedUrl } from "@/lib/utils";

export type HeroSettingsValue = { videoUrl: string; posterUrl: string };
export type ShowreelValue = { url: string; videoType: "url" | "upload" };

export type PageSettingsProps = {
  initialHero: HeroSettingsValue;
  initialShowreel: ShowreelValue;
};

export function PageSettings({ initialHero, initialShowreel }: PageSettingsProps) {
  const [heroState, heroDispatch] = useReducer(
    reduceSaveableSettingState<HeroSettingsValue>,
    initialHero,
    createSaveableSettingState,
  );
  const [showreelState, showreelDispatch] = useReducer(
    reduceSaveableSettingState<ShowreelValue>,
    initialShowreel,
    createSaveableSettingState,
  );
  const isDirty =
    isSaveableSettingDirty(heroState) || isSaveableSettingDirty(showreelState);
  const confirmNavigation = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm("有尚未保存的更改，确定要离开吗？");
  }, [isDirty]);

  useAdminNavigationGuard(confirmNavigation, isDirty);

  function changeHero(value: Partial<HeroSettingsValue>) {
    heroDispatch({ type: "change", value: { ...heroState.draft, ...value } });
  }

  function changeShowreel(value: Partial<ShowreelValue>) {
    showreelDispatch({ type: "change", value: { ...showreelState.draft, ...value } });
  }

  async function saveHero() {
    heroDispatch({ type: "save-start" });
    try {
      const response = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: heroState.draft.videoUrl,
          posterUrl: heroState.draft.posterUrl,
        }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      heroDispatch({ type: "save-success" });
    } catch (error) {
      heroDispatch({ type: "save-error", message: error instanceof Error ? error.message : "保存失败，请重试" });
    }
  }

  async function saveShowreel() {
    showreelDispatch({ type: "save-start" });
    try {
      const response = await fetch("/api/showreel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showreelUrl: showreelState.draft.url, videoType: showreelState.draft.videoType }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      showreelDispatch({ type: "save-success" });
    } catch (error) {
      showreelDispatch({ type: "save-error", message: error instanceof Error ? error.message : "保存失败，请重试" });
    }
  }

  return (
    <div className="mx-auto max-w-[60rem] space-y-8">
      <AdminPageHeader
        title="PAGE MEDIA"
        subtitle="页面媒体"
        meta="首页和 Works 页使用的影片素材，保存后才会发布。"
      />
      <HeroSettingsCard state={heroState} onChange={changeHero} onSave={saveHero} />
      <ShowreelSettingsCard state={showreelState} onChange={changeShowreel} onSave={saveShowreel} />
    </div>
  );
}

function HeroSettingsCard({
  state,
  onChange,
  onSave,
}: {
  state: SaveableSettingState<HeroSettingsValue>;
  onChange: (value: Partial<HeroSettingsValue>) => void;
  onSave: () => void;
}) {
  const disabled = state.status === "saving";
  return (
    <AdminFormSection index="01" title="Hero 背景" description="视频与封面分开选择，通过同一个保存操作一起更新首页。">
      <div className="space-y-6">
        <MediaAssetRow
          title="背景视频"
          preview={<MediaAssetPreview kind="video" url={state.saved.videoUrl} label="当前已保存的 Hero 视频" />}
          controls={<div className="min-w-0 space-y-3">
            <MediaPicker
              kind="video"
              accept="video/mp4"
              value={state.draft.videoUrl}
              onSelect={(videoUrl) => onChange({ videoUrl })}
              label="更换 Hero 视频"
              disabled={disabled}
            />
            {state.draft.videoUrl !== state.saved.videoUrl ? (
              <MediaAssetPreview kind="video" url={state.draft.videoUrl} label="待保存的视频预览" />
            ) : null}
          </div>}
        />
        <MediaAssetRow
          title="封面图片"
          preview={<MediaAssetPreview kind="image" url={state.saved.posterUrl} label="当前已保存的 Hero 封面" />}
          controls={<div className="min-w-0 space-y-3">
            <MediaPicker
              kind="image"
              value={state.draft.posterUrl}
              onSelect={(posterUrl) => onChange({ posterUrl })}
              label="替换封面"
              disabled={disabled}
            />
            {state.draft.posterUrl !== state.saved.posterUrl ? (
              <MediaAssetPreview kind="image" url={state.draft.posterUrl} label="待保存的封面预览" />
            ) : null}
          </div>}
        />
        <SettingsSaveAction state={state} onSave={onSave} />
      </div>
    </AdminFormSection>
  );
}

function ShowreelSettingsCard({
  state,
  onChange,
  onSave,
}: {
  state: SaveableSettingState<ShowreelValue>;
  onChange: (value: Partial<ShowreelValue>) => void;
  onSave: () => void;
}) {
  const value = state.draft;
  const disabled = state.status === "saving";
  return (
    <AdminFormSection index="02" title="Works Showreel" description="设置 Works 页面展示的影片来源，保存后才会更新公开页面。">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" aria-label="Showreel 来源类型">
          {(["url", "upload"] as const).map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={value.videoType === type ? "secondary" : "outline"}
              disabled={disabled}
              onClick={() => onChange({ videoType: type })}
              aria-pressed={value.videoType === type}
            >
              {type === "url" ? "嵌入链接" : "上传视频"}
            </Button>
          ))}
        </div>

        {value.videoType === "url" ? (
          <MediaAssetRow
            title="嵌入预览"
            preview={<EmbedPreview url={value.url} />}
            controls={<div className="space-y-2">
              <Label htmlFor="showreel-url">Showreel 嵌入链接</Label>
              <Input
                id="showreel-url"
                type="url"
                value={value.url}
                onChange={(event) => onChange({ url: event.target.value })}
                disabled={disabled}
                placeholder="粘贴 YouTube 或 Bilibili 链接"
              />
            </div>}
          />
        ) : (
          <MediaAssetRow
            title="Showreel 视频"
            preview={
              <MediaAssetPreview
                kind="video"
                url={state.saved.videoType === "upload" ? state.saved.url : ""}
                label="当前已保存的 Showreel 视频"
              />
            }
            controls={<div className="min-w-0 space-y-3">
              <MediaPicker kind="video" value={value.url} onSelect={(url) => onChange({ url })} label="更换 Showreel 视频" disabled={disabled} />
              {value.url && value.url !== state.saved.url ? (
                <MediaAssetPreview kind="video" url={value.url} label="待保存的视频预览" />
              ) : null}
            </div>}
          />
        )}
        <SourceDetails saved={state.saved.url} draft={value.url} source={value.videoType === "url" ? "嵌入链接" : "上传视频"} />
        <SettingsSaveAction state={state} onSave={onSave} />
      </div>
    </AdminFormSection>
  );
}

function MediaAssetRow({ title, preview, controls }: { title: string; preview: ReactNode; controls: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 lg:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)] lg:gap-6">
      <div className="min-w-0 max-w-[22.5rem]">
        <h3 className="mb-2 text-xs font-medium text-neutral-300">{title}</h3>
        {preview}
      </div>
      <div className="min-w-0 space-y-3 lg:self-center">{controls}</div>
    </section>
  );
}

function MediaAssetPreview({ kind, url, label }: { kind: "image" | "video"; url: string; label: string }) {
  if (!url) {
    return <p className="rounded-md border border-dashed border-white/15 px-3 py-5 text-xs text-neutral-500">{label}：尚未设置。</p>;
  }

  return (
    <div className="min-w-0 space-y-2">
      <p className="text-xs text-neutral-400">{label}</p>
      <div className="relative aspect-video overflow-hidden rounded-md border border-white/10 bg-black">
        {kind === "video" ? (
          <video src={url} controls muted playsInline className="size-full object-contain" />
        ) : (
          <Image src={url} alt={label} fill unoptimized sizes="(max-width: 1280px) 100vw, 50vw" className="object-contain" />
        )}
      </div>
      <p className="break-all text-xs text-neutral-500" title={url}>{url}</p>
    </div>
  );
}

function SettingsSaveAction<T>({ state, onSave }: { state: SaveableSettingState<T>; onSave: () => void }) {
  const saving = state.status === "saving";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
      <div className="min-w-0 space-y-1">
        <SettingStatus status={state.status} />
        {state.status === "saved" ? <p role="status" aria-live="polite" className="text-xs text-emerald-200">设置已保存。</p> : null}
        {state.error ? <p role="alert" className="text-xs text-red-200">{state.error}</p> : null}
      </div>
      <Button type="button" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
        {saving ? "保存中" : "保存更改"}
      </Button>
    </div>
  );
}

function SettingStatus({ status }: { status: SaveableSettingState<unknown>["status"] }) {
  const content = {
    clean: { label: "已保存", tone: "ordinary" as const },
    dirty: { label: "有未保存变更", tone: "dirty" as const },
    saving: { label: "正在保存", tone: "ordinary" as const },
    saved: { label: "已保存", tone: "saved" as const },
    error: { label: "保存失败", tone: "error" as const },
  }[status];
  return <AdminStatus tone={content.tone}>{content.label}</AdminStatus>;
}

function EmbedPreview({ url }: { url: string }) {
  if (!url) return <p className="rounded-md border border-dashed border-white/15 px-3 py-5 text-sm text-neutral-500">输入链接后将在此处预览。</p>;
  const embedUrl = getEmbedUrl(url);
  return <div className="overflow-hidden rounded-md border border-white/10 bg-black"><iframe src={embedUrl} title="Showreel 预览" className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
}

function SourceDetails({ saved, draft, source }: { saved: string; draft: string; source?: string }) {
  return (
    <div className="min-w-0 space-y-1 bg-white/[0.03] px-3 py-2 text-xs text-neutral-400">
      <p className="break-all">已保存来源：{saved || "尚未设置"}</p>
      {draft !== saved ? <p className="break-all text-amber-200">待保存来源：{draft || "尚未设置"}</p> : null}
      {source ? <p>当前来源类型：{source}</p> : null}
    </div>
  );
}

async function responseMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" && body.error ? body.error : "保存失败，请重试";
  } catch {
    return "保存失败，请重试";
  }
}
