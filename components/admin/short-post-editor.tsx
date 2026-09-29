"use client";

import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { ArrowLeft, EyeOff, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminNavigationGuard } from "@/components/admin/admin-shell";
import { AdminEditorHeader } from "@/components/admin/admin-editor-header";
import { AdminFormSection } from "@/components/admin/admin-form-section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toast";
import {
  confirmPostEditorNavigation,
  createPostEditorState,
  createPostPayload,
  getPostEditorActions,
  reducePostEditorState,
  validatePostEditor,
} from "@/lib/admin-news";
import type { PostItem } from "@/lib/types";

const fallbackError = "保存失败，请稍后重试。";

export function ShortPostEditor({ initialPost }: { initialPost?: PostItem }) {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const [state, dispatch] = useReducer(
    reducePostEditorState,
    initialPost,
    (post) => createPostEditorState("short", post),
  );
  const isDirty = useMemo(
    () => JSON.stringify({
      title: state.title,
      body: state.body,
      tag: state.tag,
      intendedPublished: state.intendedPublished,
    }) !== JSON.stringify(state.baseline),
    [state],
  );
  const saving = state.status === "saving";
  const statusText = saving
    ? "保存中…"
    : state.status === "saved"
      ? "已保存"
      : state.status === "error"
        ? "保存失败"
        : isDirty
          ? "有未保存的更改"
          : "所有更改已保存";
  const actions = getPostEditorActions(state.intendedPublished);
  const confirmNavigation = useCallback(
    () => confirmPostEditorNavigation(isDirty, () => window.confirm("有尚未保存的更改，确定要离开吗？")),
    [isDirty],
  );

  const { allowNextHistoryPop } = useAdminNavigationGuard(confirmNavigation, isDirty);

  function leaveEditor() {
    if (!confirmNavigation()) return;
    allowNextHistoryPop();
    router.back();
  }

  async function save(published: boolean) {
    const validation = validatePostEditor(state);
    if (!validation.ok) {
      setAnnouncement(validation.message);
      bodyRef.current?.focus();
      return;
    }

    dispatch({ type: "save-start", published });
    setAnnouncement("");
    const endpoint = initialPost ? `/api/posts/${initialPost.id}` : "/api/posts";
    const method = initialPost ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPostPayload(state, published)),
      });
      const result = (await response.json()) as PostItem | { error?: unknown };
      if (!response.ok) {
        throw new Error(
          "error" in result && typeof result.error === "string" && result.error
            ? result.error
            : fallbackError,
        );
      }

      dispatch({ type: "save-success" });
      setAnnouncement("内容已保存");
      toastSuccess("内容已保存");
      if (!initialPost) router.replace(`/dashboard/news/${(result as PostItem).id}/edit`);
    } catch (error) {
      const message = error instanceof Error ? error.message : fallbackError;
      dispatch({ type: "save-error", message });
      setAnnouncement(message);
      toastError(message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <AdminEditorHeader
        title={initialPost ? "编辑短动态" : "新建短动态"}
        status={statusText}
        backAction={(
          <Button type="button" variant="ghost" onClick={leaveEditor} className="shrink-0">
            <ArrowLeft aria-hidden="true" /> 返回
          </Button>
        )}
      >
        <Button type="button" variant="outline" disabled={saving} onClick={() => void save(actions.secondary.published)}>
          {state.intendedPublished ? <EyeOff aria-hidden="true" /> : <Save aria-hidden="true" />}
          {actions.secondary.label}
        </Button>
        <Button type="button" disabled={saving} onClick={() => void save(actions.primary.published)}>
          {state.intendedPublished ? <Save aria-hidden="true" /> : <Send aria-hidden="true" />}
          {actions.primary.label}
        </Button>
      </AdminEditorHeader>

      <p className="sr-only" role="status" aria-live="polite">{announcement || statusText}</p>
      {state.error ? <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</p> : null}

      <fieldset disabled={saving} className="min-w-0 space-y-8">
        <AdminFormSection index="01" title="正文" description="简短记录创作进展、想法或动态。">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="short-post-body">短动态</Label>
              <span className="text-xs text-neutral-500" aria-live="polite">{state.body.length} 字</span>
            </div>
            <textarea
              ref={bodyRef}
              id="short-post-body"
              rows={9}
              value={state.body}
              onChange={(event) => dispatch({ type: "field", field: "body", value: event.target.value })}
              className={textareaClassName}
              placeholder="写下此刻的动态…"
            />
          </div>
        </AdminFormSection>
        <AdminFormSection index="02" title="标签" description="可选，用于归类这条动态。">
          <div className="space-y-2">
            <Label htmlFor="short-post-tag">标签（可选）</Label>
            <input
              id="short-post-tag"
              value={state.tag}
              onChange={(event) => dispatch({ type: "field", field: "tag", value: event.target.value })}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              placeholder="例如：日常"
            />
          </div>
        </AdminFormSection>
      </fieldset>
    </div>
  );
}

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
