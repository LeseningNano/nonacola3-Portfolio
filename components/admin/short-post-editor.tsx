"use client";

import { useMemo, useReducer, useRef, useState } from "react";
import { ArrowLeft, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toast";
import {
  createPostEditorState,
  createPostPayload,
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

  function leaveEditor() {
    if (isDirty && !window.confirm("有尚未保存的更改，确定要离开吗？")) return;
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={leaveEditor}>
          <ArrowLeft /> 返回
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={() => void save(false)}>
            <Save /> {saving ? "保存中…" : "保存草稿"}
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save(true)}>
            <Send /> 发布
          </Button>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      {state.error ? <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</p> : null}

      <fieldset disabled={saving} className="space-y-5 rounded-xl border border-white/10 bg-neutral-950/40 p-5 sm:p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="short-post-body">正文</Label>
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
      </fieldset>
    </div>
  );
}

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
