"use client";

import { useState } from "react";
import { Monitor, Play, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkFormState } from "@/lib/admin-works";

export function WorkCardPreview({ value }: { value: WorkFormState }) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const role = value.role.trim();
  const tools = value.tools.trim();
  const summary = value.summary.trim();

  return (
    <section aria-label="作品卡片预览" className="space-y-3">
      <div className="flex items-center justify-end gap-3">
        <div className="flex gap-1" role="group" aria-label="预览宽度">
          <Button
            type="button"
            size="icon-sm"
            variant={viewport === "desktop" ? "secondary" : "ghost"}
            aria-label="桌面预览"
            aria-pressed={viewport === "desktop"}
            onClick={() => setViewport("desktop")}
          >
            <Monitor />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant={viewport === "mobile" ? "secondary" : "ghost"}
            aria-label="移动端预览"
            aria-pressed={viewport === "mobile"}
            onClick={() => setViewport("mobile")}
          >
            <Smartphone />
          </Button>
        </div>
      </div>

      <div className="min-w-0 rounded-md bg-admin-canvas p-3 sm:p-4">
        <article
          className={`mx-auto min-w-0 space-y-5 transition-[max-width] ${viewport === "mobile" ? "max-w-sm" : "max-w-3xl"}`}
        >
          <div className="relative aspect-video overflow-hidden bg-admin-raised">
            {value.thumbnail ? (
              // Preview accepts arbitrary Blob URLs selected by administrators.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-admin-fg-3">
                <Play className="h-10 w-10" aria-hidden="true" />
                <span className="sr-only">没有缩略图</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="break-words text-2xl text-white">{value.title.trim() || "未命名作品"}</h3>
            <p className="mt-1 break-words text-sm text-admin-fg-3">{value.category.trim() || "未分类"}</p>
            {role || tools ? (
              <dl className="mt-5 space-y-2 text-sm">
                {role ? <Metadata label="Role" value={role} /> : null}
                {tools ? <Metadata label="Tools" value={tools} /> : null}
              </dl>
            ) : null}
            {summary ? <p className="mt-5 break-words text-sm leading-6 text-admin-fg-3">{summary}</p> : null}
            <p className="mt-5 text-sm text-admin-fg-2">View Case Study →</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] gap-4">
      <dt className="text-admin-fg-3">{label}</dt>
      <dd className="min-w-0 break-words text-admin-fg-2">{value}</dd>
    </div>
  );
}
