"use client";

import type { ReactNode } from "react";
import { useCallback, useReducer, useState } from "react";
import { Loader2, Save, Undo2 } from "lucide-react";
import { useAdminNavigationGuard } from "@/components/admin/admin-shell";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatus } from "@/components/admin/admin-status";
import { MediaField } from "@/components/admin/media-field";
import { Button } from "@/components/ui/button";
import {
  createSaveableSettingState,
  isSaveableSettingDirty,
  reduceSaveableSettingState,
  type SaveableSettingState,
} from "@/lib/admin-settings";
import { describeMediaSource } from "@/lib/admin-media-source";
import { DEFAULT_HERO_POSTER_URL } from "@/lib/hero";
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
    <div className="mx-auto max-w-[60rem] space-y-5">
      <AdminPageHeader
        title="PAGE MEDIA"
        subtitle="页面媒体"
        meta={<span className="font-sans">首页和 Works 页使用的影片素材，保存后才会发布。</span>}
      />
      <HeroSettingsGroup
        state={heroState}
        onChange={changeHero}
        onRevert={(field) => heroDispatch({ type: "revert-field", field })}
        onSave={saveHero}
      />
      <ShowreelSettingsGroup
        state={showreelState}
        onChange={changeShowreel}
        onRevert={(field) => showreelDispatch({ type: "revert-field", field })}
        onSave={saveShowreel}
      />
    </div>
  );
}

function mediaName(url: string) {
  if (!url) return "未设置";
  return url === DEFAULT_HERO_POSTER_URL ? "默认封面" : describeMediaSource(url).name;
}

function countPending<T extends Record<string, unknown>>(state: SaveableSettingState<T>) {
  return (Object.keys(state.draft) as Array<keyof T>).filter((key) => state.draft[key] !== state.saved[key]).length;
}

// 草稿与已保存值不同时，为素材槽提供「待保存」标记、对比说明和撤销按钮
function getPendingSlot({ saved, draft, onRevert, disabled }: { saved: string; draft: string; onRevert: () => void; disabled: boolean }) {
  if (saved === draft) return null;
  return {
    badge: <span className="rounded-[3px] bg-admin-accent px-1.5 text-xs font-medium text-admin-accent-fg">待保存</span>,
    description: (
      <p className="truncate font-admin-mono text-xs text-admin-fg-3" title={`当前 ${saved || "未设置"} → 待保存 ${draft || "未设置"}`}>
        当前 {mediaName(saved)} → 待保存 {mediaName(draft)}
      </p>
    ),
    action: (
      <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={onRevert}>
        <Undo2 aria-hidden="true" />撤销
      </Button>
    ),
  };
}

function HeroSettingsGroup({
  state,
  onChange,
  onRevert,
  onSave,
}: {
  state: SaveableSettingState<HeroSettingsValue>;
  onChange: (value: Partial<HeroSettingsValue>) => void;
  onRevert: (field: keyof HeroSettingsValue) => void;
  onSave: () => void;
}) {
  const disabled = state.status === "saving";
  const video = getPendingSlot({ saved: state.saved.videoUrl, draft: state.draft.videoUrl, onRevert: () => onRevert("videoUrl"), disabled });
  const poster = getPendingSlot({ saved: state.saved.posterUrl, draft: state.draft.posterUrl, onRevert: () => onRevert("posterUrl"), disabled });
  const isDefaultPoster = state.draft.posterUrl === DEFAULT_HERO_POSTER_URL;

  return (
    <MediaGroup
      title="首页 Hero"
      hint="视频和封面一起保存"
      footer={<SaveBar state={state} pending={countPending(state)} label="保存 Hero" onSave={onSave} />}
    >
      <MediaField
        id="hero-video"
        label="背景视频"
        kind="video"
        accept="video/mp4"
        size="large"
        value={state.draft.videoUrl}
        previewPoster={state.draft.posterUrl}
        onChange={(videoUrl) => onChange({ videoUrl })}
        disabled={disabled}
        badge={video?.badge}
        description={video?.description}
        actions={video?.action}
      />
      <MediaField
        id="hero-poster"
        label="封面图片"
        kind="image"
        size="large"
        value={state.draft.posterUrl}
        onChange={(posterUrl) => onChange({ posterUrl })}
        disabled={disabled}
        badge={<>{isDefaultPoster ? <span className="text-xs text-admin-fg-3">默认封面</span> : null}{poster?.badge}</>}
        description={poster?.description ?? (isDefaultPoster ? <p className="text-xs text-admin-fg-3">视频加载前和自动播放失败时显示</p> : undefined)}
        actions={poster?.action}
      />
    </MediaGroup>
  );
}

function ShowreelSettingsGroup({
  state,
  onChange,
  onRevert,
  onSave,
}: {
  state: SaveableSettingState<ShowreelValue>;
  onChange: (value: Partial<ShowreelValue>) => void;
  onRevert: (field: keyof ShowreelValue) => void;
  onSave: () => void;
}) {
  const [previewing, setPreviewing] = useState(false);
  const value = state.draft;
  const disabled = state.status === "saving";
  const pending = getPendingSlot({ saved: state.saved.url, draft: value.url, onRevert: () => onRevert("url"), disabled });

  return (
    <MediaGroup
      title="Works Showreel"
      headerAction={(
        <AdminFilterGroup<ShowreelValue["videoType"]>
          label="Showreel 来源类型"
          value={value.videoType}
          disabled={disabled}
          options={[{ value: "url", label: "嵌入链接" }, { value: "upload", label: "上传视频" }]}
          onChange={(videoType) => onChange({ videoType })}
        />
      )}
      footer={<SaveBar state={state} pending={countPending(state)} label="保存 Showreel" onSave={onSave} />}
    >
      {value.videoType === "url" ? (
        <>
          <MediaField
            id="showreel-url"
            label="Showreel 影片"
            kind="video"
            allowEmbed
            size="large"
            value={value.url}
            onChange={(url) => onChange({ url })}
            disabled={disabled}
            badge={pending?.badge}
            description={pending?.description}
            actions={(
              <>
                {value.url ? (
                  <Button type="button" size="sm" variant="ghost" aria-expanded={previewing} onClick={() => setPreviewing((current) => !current)}>
                    {previewing ? "收起预览" : "预览播放"}
                  </Button>
                ) : null}
                {pending?.action}
              </>
            )}
          />
          {previewing && value.url ? <EmbedPreview url={value.url} /> : null}
        </>
      ) : (
        <MediaField
          id="showreel-video"
          label="Showreel 视频"
          kind="video"
          size="large"
          value={value.url}
          onChange={(url) => onChange({ url })}
          disabled={disabled}
          badge={pending?.badge}
          description={pending?.description}
          actions={pending?.action}
        />
      )}
    </MediaGroup>
  );
}

function MediaGroup({ title, hint, headerAction, footer, children }: { title: string; hint?: string; headerAction?: ReactNode; footer: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="overflow-hidden rounded-lg bg-admin-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5">
        <h2 className="text-sm font-medium text-admin-fg">{title}</h2>
        {headerAction ?? (hint ? <p className="text-xs text-admin-fg-3">{hint}</p> : null)}
      </div>
      <div className="space-y-4 px-2 pt-2 pb-3">{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-line px-4 py-3">{footer}</div>
    </section>
  );
}

function SaveBar<T>({ state, pending, label, onSave }: { state: SaveableSettingState<T>; pending: number; label: string; onSave: () => void }) {
  const saving = state.status === "saving";
  const dirty = isSaveableSettingDirty(state);
  const status = saving
    ? <AdminStatus tone="saving">保存中…</AdminStatus>
    : state.status === "error"
      ? <p role="alert"><AdminStatus tone="error">保存失败：{state.error}</AdminStatus></p>
      : state.status === "saved"
        ? <p role="status"><AdminStatus tone="saved">设置已保存</AdminStatus></p>
        : dirty
          ? <AdminStatus tone="dirty">{pending} 项待保存</AdminStatus>
          : <AdminStatus tone="ordinary">已保存</AdminStatus>;

  return (
    <>
      <div className="min-w-0" aria-live="polite">{status}</div>
      <Button type="button" variant={dirty ? "default" : "outline"} onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
        {saving ? "保存中" : label}
      </Button>
    </>
  );
}

function EmbedPreview({ url }: { url: string }) {
  return (
    <div className="mx-2 overflow-hidden rounded-md bg-black">
      <iframe
        src={getEmbedUrl(url)}
        title="Showreel 预览"
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
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
