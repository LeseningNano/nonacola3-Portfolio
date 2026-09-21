"use client";

import { useMemo, useReducer, useRef, useState } from "react";
import { ArrowLeft, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { MarkdownBody } from "@/components/markdown-body";
import { MarkdownEditor } from "@/components/markdown-editor";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createPostEditorState,
  createPostPayload,
  reducePostEditorState,
  validatePostEditor,
} from "@/lib/admin-news";
import type { PostItem } from "@/lib/types";

const fallbackError = "保存失败，请稍后重试。";

export function ArticleEditor({ initialPost }: { initialPost?: PostItem }) {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const titleRef = useRef<HTMLInputElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const [state, dispatch] = useReducer(
    reducePostEditorState,
    initialPost,
    (post) => createPostEditorState("article", post),
  );
  const isDirty = useMemo(
    () =>
      JSON.stringify({
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

  function leaveEditor() {
    if (isDirty && !window.confirm("有尚未保存的更改，确定要离开吗？")) return;
    router.back();
  }

  function focusInvalidField(field: "title" | "body") {
    if (field === "title") {
      titleRef.current?.focus();
      return;
    }
    document.getElementById("article-body")?.focus();
  }

  async function save(published: boolean) {
    const validation = validatePostEditor(state);
    if (!validation.ok) {
      setAnnouncement(validation.message);
      focusInvalidField(validation.field);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={leaveEditor}>
          <ArrowLeft /> 返回
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500" aria-hidden="true">{statusText}</span>
          <Button type="button" variant="outline" disabled={saving} onClick={() => void save(false)}>
            <Save /> {saving ? "保存中…" : "保存草稿"}
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save(true)}>
            <Send /> 发布
          </Button>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{announcement || statusText}</p>
      {state.error ? (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <fieldset disabled={saving} className="space-y-5">
        <div className="grid gap-5 rounded-xl border border-white/10 bg-neutral-950/40 p-5 sm:grid-cols-2 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="article-title">标题</Label>
            <input
              ref={titleRef}
              id="article-title"
              value={state.title}
              onChange={(event) => dispatch({ type: "field", field: "title", value: event.target.value })}
              className={inputClassName}
              placeholder="文章标题"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="article-tag">标签（可选）</Label>
            <input
              id="article-tag"
              value={state.tag}
              onChange={(event) => dispatch({ type: "field", field: "tag", value: event.target.value })}
              className={inputClassName}
              placeholder="例如：创作笔记"
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="space-y-2" aria-labelledby="article-editor-label">
            <Label id="article-editor-label" htmlFor="article-body">正文</Label>
            <MarkdownEditor
              value={state.body}
              onChange={(value) => dispatch({ type: "field", field: "body", value })}
              textareaProps={{
                id: "article-body",
                rows: 20,
                placeholder: "使用 Markdown 撰写正文…",
                "aria-labelledby": "article-editor-label",
              }}
            />
          </section>

          <section className="space-y-2" aria-labelledby="article-preview-label">
            <h2 id="article-preview-label" className="text-sm font-medium text-neutral-200">实时预览</h2>
            <div className="min-h-80 rounded-xl border border-white/10 bg-neutral-950/40 p-5 sm:p-6">
              {state.body.trim() ? <MarkdownBody content={state.body} /> : <p className="text-sm text-neutral-500">尚无内容可预览。</p>}
            </div>
          </section>
        </div>
      </fieldset>
    </div>
  );
}

const inputClassName =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
