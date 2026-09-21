"use client";

import { useReducer } from "react";
import { Loader2, Save } from "lucide-react";
import { MediaPicker } from "@/components/admin/media-picker";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSaveableSettingState,
  reduceSaveableSettingState,
  type SaveableSettingState,
} from "@/lib/admin-settings";
import { getEmbedUrl } from "@/lib/utils";

type ShowreelValue = { url: string; videoType: "url" | "upload" };

export type PageSettingsProps = {
  initialHeroUrl: string;
  initialShowreel: ShowreelValue;
};

export function PageSettings({ initialHeroUrl, initialShowreel }: PageSettingsProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="页面设置"
        description="更换首页 Hero 背景视频和 Works Showreel。选择或上传媒体后，需明确保存才会发布变更。"
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <HeroSettingsCard initialUrl={initialHeroUrl} />
        <ShowreelSettingsCard initialValue={initialShowreel} />
      </div>
    </div>
  );
}

export function HeroSettingsCard({ initialUrl }: { initialUrl: string }) {
  const [state, dispatch] = useReducer(reduceSaveableSettingState<string>, initialUrl, createSaveableSettingState);

  async function save() {
    dispatch({ type: "save-start" });
    try {
      const response = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: state.draft }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      dispatch({ type: "save-success" });
    } catch (error) {
      dispatch({ type: "save-error", message: error instanceof Error ? error.message : "保存失败，请重试" });
    }
  }

  return (
    <SettingsCard title="Hero 背景视频" description="选择 MP4 背景视频；保存后才会更新首页。" state={state} onSave={save}>
      <VideoPreview url={state.saved} label="当前已保存的 Hero 视频" />
      <MediaPicker kind="video" accept="video/mp4" value={state.draft} onSelect={(url) => dispatch({ type: "change", value: url })} label="更换 Hero 视频" disabled={state.status === "saving"} />
      {state.draft && state.draft !== state.saved ? <VideoPreview url={state.draft} label="待保存的 Hero 视频预览" /> : null}
      <SourceDetails saved={state.saved} draft={state.draft} />
    </SettingsCard>
  );
}

export function ShowreelSettingsCard({ initialValue }: { initialValue: ShowreelValue }) {
  const [state, dispatch] = useReducer(
    reduceSaveableSettingState<ShowreelValue>,
    initialValue,
    createSaveableSettingState,
  );
  const value = state.draft;

  function change(value: Partial<ShowreelValue>) {
    dispatch({ type: "change", value: { ...state.draft, ...value } });
  }

  async function save() {
    dispatch({ type: "save-start" });
    try {
      const response = await fetch("/api/showreel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showreelUrl: state.draft.url, videoType: state.draft.videoType }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      dispatch({ type: "save-success" });
    } catch (error) {
      dispatch({ type: "save-error", message: error instanceof Error ? error.message : "保存失败，请重试" });
    }
  }

  return (
    <SettingsCard title="Works Showreel" description="使用嵌入链接或上传的视频，保存后才会更新 Works 页面。" state={state} onSave={save}>
      <div className="flex gap-2" aria-label="Showreel 来源类型">
        {(["url", "upload"] as const).map((type) => (
          <Button key={type} type="button" size="sm" variant={value.videoType === type ? "secondary" : "outline"} disabled={state.status === "saving"} onClick={() => change({ videoType: type })} aria-pressed={value.videoType === type}>
            {type === "url" ? "嵌入链接" : "上传视频"}
          </Button>
        ))}
      </div>

      {value.videoType === "url" ? (
        <div className="space-y-2">
          <Label htmlFor="showreel-url">Showreel 嵌入链接</Label>
          <Input id="showreel-url" type="url" value={value.url} onChange={(event) => change({ url: event.target.value })} disabled={state.status === "saving"} placeholder="粘贴 YouTube 或 Bilibili 链接" />
          <EmbedPreview url={value.url} />
        </div>
      ) : (
        <div className="space-y-3">
          <VideoPreview url={state.saved.videoType === "upload" ? state.saved.url : ""} label="当前已保存的上传视频" />
          <MediaPicker kind="video" value={value.url} onSelect={(url) => change({ url })} label="更换 Showreel 视频" disabled={state.status === "saving"} />
          {value.url && value.url !== state.saved.url ? <VideoPreview url={value.url} label="待保存的视频预览" /> : null}
        </div>
      )}
      <SourceDetails saved={state.saved.url} draft={value.url} source={value.videoType === "url" ? "嵌入链接" : "上传视频"} />
    </SettingsCard>
  );
}

function SettingsCard<T>({ title, description, state, onSave, children }: { title: string; description: string; state: SaveableSettingState<T>; onSave: () => void; children: React.ReactNode }) {
  const saving = state.status === "saving";
  const status = state.status === "dirty" ? "有未保存变更" : state.status === "saving" ? "正在保存…" : state.status === "saved" ? "已保存" : state.status === "error" ? "保存失败" : "已保存内容";
  return <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
    <div className="space-y-1"><div className="flex items-center justify-between gap-3"><h2 className="text-base font-medium text-white">{title}</h2><span className="text-xs text-neutral-400">{status}</span></div><p className="text-sm text-neutral-400">{description}</p></div>
    {children}
    {state.status === "saved" ? <p role="status" aria-live="polite" className="text-sm text-emerald-200">设置已保存。</p> : null}
    {state.error ? <p role="alert" className="text-sm text-red-200">{state.error}</p> : null}
    <Button type="button" onClick={onSave} disabled={saving} className="w-full"><>{saving ? <Loader2 className="animate-spin" /> : <Save />}</> {saving ? "保存中" : "保存设置"}</Button>
  </section>;
}

function VideoPreview({ url, label }: { url: string; label: string }) {
  if (!url) return <p className="rounded-lg border border-dashed border-white/15 px-3 py-6 text-sm text-neutral-500">{label}：尚未设置。</p>;
  return <div className="space-y-2"><p className="text-xs text-neutral-400">{label}</p><video src={url} controls muted playsInline className="aspect-video w-full rounded-lg border border-white/10 bg-black object-contain" /><p className="truncate text-xs text-neutral-500" title={url}>{url}</p></div>;
}

function EmbedPreview({ url }: { url: string }) {
  if (!url) return <p className="rounded-lg border border-dashed border-white/15 px-3 py-6 text-sm text-neutral-500">输入链接后将在此处预览。</p>;
  const embedUrl = getEmbedUrl(url);
  return <div className="overflow-hidden rounded-lg border border-white/10 bg-black"><iframe src={embedUrl} title="Showreel 预览" className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
}

function SourceDetails({ saved, draft, source }: { saved: string; draft: string; source?: string }) {
  return <div className="space-y-1 rounded-lg bg-white/5 px-3 py-2 text-xs text-neutral-400"><p>已保存来源：{saved || "尚未设置"}</p>{draft !== saved ? <p className="text-amber-200">待保存来源：{draft || "尚未设置"}</p> : null}{source ? <p>当前来源类型：{source}</p> : null}</div>;
}

async function responseMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" && body.error ? body.error : "保存失败，请重试";
  } catch {
    return "保存失败，请重试";
  }
}
