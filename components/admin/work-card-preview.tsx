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
    <section aria-labelledby="work-preview-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="work-preview-title" className="text-sm font-medium text-white">卡片预览</h2>
        <div className="flex gap-1" aria-label="预览宽度">
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

      <div className="overflow-x-auto rounded-xl bg-neutral-950/60 p-4">
        <article
          className={`mx-auto space-y-5 transition-[max-width] ${viewport === "mobile" ? "max-w-sm" : "max-w-3xl"}`}
        >
          <div className="relative aspect-video overflow-hidden bg-neutral-900">
            {value.thumbnail ? (
              // Preview accepts arbitrary Blob URLs selected by administrators.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-600">
                <Play className="h-10 w-10" aria-hidden="true" />
                <span className="sr-only">没有缩略图</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-2xl text-white">{value.title.trim() || "未命名作品"}</h3>
            <p className="mt-1 text-sm text-neutral-400">{value.category.trim() || "未分类"}</p>
            {role || tools ? (
              <dl className="mt-5 space-y-2 text-sm">
                {role ? <Metadata label="Role" value={role} /> : null}
                {tools ? <Metadata label="Tools" value={tools} /> : null}
              </dl>
            ) : null}
            {summary ? <p className="mt-5 text-sm leading-6 text-neutral-400">{summary}</p> : null}
            <p className="mt-5 text-sm text-neutral-300">View Case Study →</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4rem_1fr] gap-4">
      <dt className="text-neutral-400">{label}</dt>
      <dd className="text-neutral-300">{value}</dd>
    </div>
  );
}
