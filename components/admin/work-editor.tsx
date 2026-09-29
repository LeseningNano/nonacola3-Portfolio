"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminNavigationGuard } from "@/components/admin/admin-shell";
import { AdminEditorHeader } from "@/components/admin/admin-editor-header";
import { AdminFormSection } from "@/components/admin/admin-form-section";
import { MediaPicker } from "@/components/admin/media-picker";
import { WorkCardPreview } from "@/components/admin/work-card-preview";
import { MarkdownEditor } from "@/components/markdown-editor";
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
    <div className="min-w-0">
      <AdminEditorHeader
        title={mode === "create" && !workId ? "新建作品" : state.form.title.trim() || "未命名作品"}
        status={statusText}
        backAction={(
          <Button type="button" variant="ghost" onClick={leaveEditor} className="shrink-0">
            <ArrowLeft aria-hidden="true" /> 返回
          </Button>
        )}
      >
        <Button
          type="button"
          variant="outline"
          disabled={!workId}
          onClick={() => workId && window.open(`/works/${workId}`, "_blank", "noopener,noreferrer")}
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

      <div className="space-y-5 pt-5">
        <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
        {state.error ? <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</p> : null}

        <div className="grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
          <fieldset disabled={saving} className="min-w-0 space-y-8">
            <AdminFormSection index="01" title="基本信息" description="作品名称、类型、日期与精选状态。">
              <Field label="标题" htmlFor="work-title">
                <Input id="work-title" required value={state.form.title} onChange={(event) => setField("title", event.target.value)} />
              </Field>
              <Field label="分类" htmlFor="work-category">
                <Input id="work-category" required value={state.form.category} onChange={(event) => setField("category", event.target.value)} />
              </Field>
              <Field label="日期" htmlFor="work-date">
                <Input id="work-date" type="date" value={state.form.date} onChange={(event) => setField("date", event.target.value)} />
              </Field>
              <div className="flex min-h-10 items-center justify-between gap-4">
                <Label htmlFor="work-featured">精选作品</Label>
                <Switch id="work-featured" checked={state.form.featured} onCheckedChange={(checked) => setField("featured", checked)} />
              </div>
            </AdminFormSection>

            <AdminFormSection index="02" title="媒体" description="公开页面使用的视频与封面。">
              <Field label="视频或嵌入地址" htmlFor="work-embed-url">
                <Input id="work-embed-url" type="url" required value={state.form.embedUrl} onChange={(event) => setField("embedUrl", event.target.value)} />
              </Field>
              <MediaPicker kind="video" value={state.form.embedUrl} onSelect={(url) => setField("embedUrl", url)} label="从媒体库选择视频" />
              <Field label="缩略图地址" htmlFor="work-thumbnail">
                <Input id="work-thumbnail" type="url" value={state.form.thumbnail} onChange={(event) => setField("thumbnail", event.target.value)} />
              </Field>
              <MediaPicker kind="image" value={state.form.thumbnail} onSelect={(url) => setField("thumbnail", url)} label="从媒体库选择缩略图" />
            </AdminFormSection>

            <AdminFormSection index="03" title="卡片信息" description="用于 Works 页面和快速浏览。">
              <Field label="卡片摘要" htmlFor="work-summary">
                <textarea id="work-summary" rows={3} value={state.form.summary} onChange={(event) => setField("summary", event.target.value)} className={textareaClassName} />
              </Field>
              <Field label="职责" htmlFor="work-role">
                <Input id="work-role" value={state.form.role} onChange={(event) => setField("role", event.target.value)} />
              </Field>
              <Field label="工具" htmlFor="work-tools">
                <Input id="work-tools" value={state.form.tools} onChange={(event) => setField("tools", event.target.value)} />
              </Field>
            </AdminFormSection>

            <AdminFormSection index="04" title="Case Study" description="作品详情页的 Markdown 内容。">
              <Field label="详细说明" htmlFor="work-description">
                <MarkdownEditor value={state.form.description} onChange={(value) => setField("description", value)} textareaProps={{ id: "work-description", rows: 12 }} />
              </Field>
            </AdminFormSection>
          </fieldset>

          <div className="min-w-0 xl:sticky xl:top-24">
            <details open className="min-w-0 space-y-3">
              <summary className="cursor-pointer text-sm font-medium text-white">作品卡片预览</summary>
              <WorkCardPreview value={state.form} />
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

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
