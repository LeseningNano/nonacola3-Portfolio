"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminNavigationGuard } from "@/components/admin/admin-shell";
import { AdminEditorHeader, getEditorStatus } from "@/components/admin/admin-editor-header";
import { AdminFormSection } from "@/components/admin/admin-form-section";
import { MediaField } from "@/components/admin/media-field";
import { WorkCardPreview } from "@/components/admin/work-card-preview";
import { MarkdownEditor } from "@/components/markdown-editor";
import { MarkdownBody } from "@/components/markdown-body";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/toast";
import {
  createWorkFormState,
  createWorkPayload,
  confirmWorkEditorNavigation,
  reduceWorkEditorState,
  type WorkFormState,
} from "@/lib/admin-works";
import type { Video } from "@/lib/types";

export function WorkEditor({
  mode,
  initialWork,
}: {
  mode: "create" | "edit";
  initialWork?: Video;
}) {
  const router = useRouter();
  const toast = useToast();
  const [workId, setWorkId] = useState(initialWork?.id ?? null);
  const [announcement, setAnnouncement] = useState("");
  const [state, dispatch] = useReducer(
    reduceWorkEditorState,
    initialWork,
    (work): ReturnType<typeof createInitialState> => createInitialState(work),
  );
  const isDirty = useMemo(
    () => JSON.stringify(state.form) !== JSON.stringify(state.baseline),
    [state.form, state.baseline],
  );
  const confirmNavigation = useCallback(
    () => confirmWorkEditorNavigation(isDirty, () => window.confirm("有尚未保存的更改，确定要离开吗？")),
    [isDirty],
  );

  const { allowNextHistoryPop, navigateAfterRelease } = useAdminNavigationGuard(confirmNavigation, isDirty);

  function setField<Field extends keyof WorkFormState>(field: Field, value: WorkFormState[Field]) {
    dispatch({ type: "field", field, value } as Parameters<typeof reduceWorkEditorState>[1]);
  }

  function leaveEditor() {
    if (!confirmNavigation()) return;
    allowNextHistoryPop();
    router.back();
  }

  async function save(returnAfterSave: boolean) {
    dispatch({ type: "save-start" });
    setAnnouncement("");
    const endpoint = mode === "create" ? "/api/videos" : `/api/videos/${initialWork!.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createWorkPayload(state.form)),
      });
      const result = (await response.json()) as Video | { error?: string };
      if (!response.ok) {
        throw new Error("error" in result && result.error ? result.error : "保存失败");
      }

      const saved = result as Video;
      const savedForm = createWorkFormState(saved);
      const finishSave = () => {
        dispatch({ type: "save-success", form: savedForm });
        setWorkId(saved.id);
        setAnnouncement("作品已保存");
        toast.success("作品已保存");

        if (returnAfterSave) {
          router.push("/dashboard/works");
        } else if (mode === "create" && !workId) {
          router.replace(`/dashboard/works/${saved.id}/edit`);
        }
      };
      if (returnAfterSave) navigateAfterRelease(finishSave);
      else finishSave();
      return true;
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "保存失败";
      dispatch({ type: "save-error", message });
      setAnnouncement(message);
      toast.error(message);
      return false;
    }
  }

  const saving = state.status === "saving";
  const statusText = saving
    ? "保存中…"
    : state.status === "error"
      ? "保存失败"
      : state.status === "saved"
        ? "已保存"
        : isDirty
          ? "有未保存的更改"
          : "所有更改已保存";

  return (
    <div className="mx-auto min-w-0 max-w-[75rem]">
      <AdminEditorHeader
        section="WORKS"
        title={mode === "create" && !workId ? "新建作品" : state.form.title.trim() || "未命名作品"}
        status={getEditorStatus(state.status, isDirty)}
        onBack={leaveEditor}
      >
        <Button
          type="button"
          variant="ghost"
          disabled={!workId}
          onClick={() => workId && window.open(`/works/${workId}`, "_blank", "noopener,noreferrer")}
          className="text-admin-fg-2"
        >
          <ExternalLink aria-hidden="true" /> 查看公开页面
        </Button>
        <Button type="button" variant="outline" disabled={saving} onClick={() => void save(true)}>
          保存并返回
        </Button>
        <Button type="button" disabled={saving} onClick={() => void save(false)}>
          <Save aria-hidden="true" /> {saving ? "保存中…" : "保存更改"}
        </Button>
      </AdminEditorHeader>

      <div className="space-y-5 pt-6">
        <p className="sr-only" role="status" aria-live="polite">{announcement || statusText}</p>
        {state.error ? <p role="alert" className="rounded-sm border border-admin-danger/30 bg-admin-danger/10 px-4 py-3 text-sm text-admin-danger">{state.error}</p> : null}

        <div className="grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(0,45rem)_minmax(20rem,23.75rem)] xl:justify-between">
          <fieldset disabled={saving} className="min-w-0 space-y-6">
            <AdminFormSection index="01" title="基本信息">
              <Field label="标题" htmlFor="work-title">
                <Input id="work-title" required value={state.form.title} onChange={(event) => setField("title", event.target.value)} className="h-9" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="分类" htmlFor="work-category">
                  <Input id="work-category" required value={state.form.category} onChange={(event) => setField("category", event.target.value)} className="h-9" />
                </Field>
                <Field label="日期" htmlFor="work-date">
                  <Input id="work-date" type="date" value={state.form.date} onChange={(event) => setField("date", event.target.value)} className="h-9 font-admin-mono" />
                </Field>
              </div>
              <div className="flex h-10 items-center justify-between gap-4 rounded-sm bg-admin-panel px-3">
                <Label htmlFor="work-featured" className="text-[13px] text-admin-fg">精选作品</Label>
                <Switch id="work-featured" checked={state.form.featured} onCheckedChange={(checked) => setField("featured", checked)} />
              </div>
            </AdminFormSection>

            <AdminFormSection index="02" title="媒体" description="公开页面使用的视频与封面">
              <MediaField id="work-video" label="作品视频" kind="video" allowEmbed value={state.form.embedUrl} onChange={(url) => setField("embedUrl", url)} />
              <MediaField id="work-thumbnail-field" label="缩略图" kind="image" optional value={state.form.thumbnail} onChange={(url) => setField("thumbnail", url)} />
            </AdminFormSection>

            <AdminFormSection index="03" title="卡片信息" description="用于 Works 页面和快速浏览">
              <Field label="卡片摘要" htmlFor="work-summary" hint={`${state.form.summary.length} 字`}>
                <textarea id="work-summary" rows={3} value={state.form.summary} onChange={(event) => setField("summary", event.target.value)} className={textareaClassName} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="职责" htmlFor="work-role">
                  <Input id="work-role" value={state.form.role} onChange={(event) => setField("role", event.target.value)} className="h-9" />
                </Field>
                <Field label="工具" htmlFor="work-tools">
                  <Input id="work-tools" value={state.form.tools} onChange={(event) => setField("tools", event.target.value)} className="h-9" />
                </Field>
              </div>
            </AdminFormSection>

            <AdminFormSection index="04" title="Case Study" description="作品详情页的 Markdown 内容，预览沿用公开页面的渲染方式">
              {/* 与文章编辑器一致：宽屏左写右看，窄屏预览排在下方 */}
              <div className="grid min-w-0 gap-5 2xl:grid-cols-2">
                <Field label="详细说明" htmlFor="work-description">
                  <MarkdownEditor value={state.form.description} onChange={(value) => setField("description", value)} textareaProps={{ id: "work-description", rows: 14 }} />
                </Field>
                <section className="min-w-0 space-y-2" aria-labelledby="work-preview-label">
                  <h2 id="work-preview-label" className="text-xs text-admin-fg-2">实时预览</h2>
                  <div className="min-h-60 min-w-0 rounded-md bg-admin-panel p-5">
                    {state.form.description.trim() ? <MarkdownBody content={state.form.description} /> : <p className="text-sm text-admin-fg-3">尚无内容可预览。</p>}
                  </div>
                </section>
              </div>
            </AdminFormSection>
          </fieldset>

          <div className="min-w-0 xl:sticky xl:top-24">
            <details open className="min-w-0 rounded-lg bg-admin-panel p-3">
              <summary className="cursor-pointer text-sm text-admin-fg">卡片预览</summary>
              <div className="pt-3">
                <WorkCardPreview value={state.form} />
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

function createInitialState(work?: Video) {
  const form = createWorkFormState(work);
  return { form, baseline: { ...form }, status: "clean" as const, error: null };
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-xs text-admin-fg-2">{label}</Label>
        {hint ? <span className="font-admin-mono text-xs text-admin-fg-3">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

const textareaClassName =
  "w-full rounded-sm border border-input bg-admin-raised px-2.5 py-2 text-sm text-admin-fg outline-none transition-colors placeholder:text-admin-fg-3 focus-visible:border-admin-accent";
