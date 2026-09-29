"use client";

/* eslint-disable @next/next/no-img-element -- Media URLs are administrator-managed and may use arbitrary public hosts. */

import { useRef, useState, type ReactNode } from "react";
import { CirclePlay, File, ImageOff, Link2, Play, VideoOff } from "lucide-react";
import { MediaPickerDialog } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describeMediaSource, type MediaSource } from "@/lib/admin-media-source";
import { cn } from "@/lib/utils";

type MediaKind = "image" | "video";

const VIDEO_FILE = /\.(mp4|webm|mov|m4v|ogv)$/i;

export type MediaFieldProps = {
  id: string;
  label: string;
  kind: MediaKind;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  optional?: boolean;
  allowEmbed?: boolean;
  disabled?: boolean;
  size?: "compact" | "large";
  badge?: ReactNode;
  description?: ReactNode;
  previewPoster?: string;
  actions?: ReactNode;
};

export function formatMediaDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const total = Math.round(seconds);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function MediaField({
  id,
  label,
  kind,
  value,
  onChange,
  accept,
  optional = false,
  allowEmbed = false,
  disabled = false,
  size = "compact",
  badge,
  description,
  previewPoster,
  actions,
}: MediaFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const source = describeMediaSource(value);
  const large = size === "large";
  const labelId = `${id}-label`;
  const urlId = `${id}-url`;
  const pickLabel = value ? "更换" : "从媒体库选择";

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span id={labelId} className="text-xs text-admin-fg-2">{label}</span>
        {badge}
      </div>
      <div
        className={cn(
          "grid min-w-0 items-center gap-3 rounded-md bg-admin-panel p-2",
          large ? "sm:grid-cols-[12.5rem_minmax(0,1fr)] sm:gap-4" : "grid-cols-[8rem_minmax(0,1fr)]",
        )}
      >
        <MediaPreview source={source} url={value} kind={kind} poster={previewPoster} large={large} />
        <div className="min-w-0 space-y-2">
          <div className="min-w-0">
            <p className="truncate font-admin-mono text-xs text-admin-fg" title={source.kind === "bilibili" || source.kind === "youtube" || source.kind === "empty" ? undefined : value}>{source.name}</p>
            {description ?? (source.detail ? <p className="text-xs text-admin-fg-3">{source.detail}</p> : null)}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" disabled={disabled} aria-label={`${pickLabel}（${label}）`} onClick={() => setPickerOpen(true)}>
              {pickLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editing ? "secondary" : "outline"}
              disabled={disabled}
              aria-expanded={editing}
              aria-controls={editing ? urlId : undefined}
              aria-label={`编辑地址（${label}）`}
              onClick={() => setEditing((current) => !current)}
            >
              编辑地址
            </Button>
            {optional && value ? (
              <Button type="button" size="sm" variant="ghost" disabled={disabled} aria-label={`清除（${label}）`} onClick={() => onChange("")}>清除</Button>
            ) : null}
            {actions}
          </div>
          {editing ? (
            <Input
              id={urlId}
              aria-labelledby={labelId}
              type="url"
              value={value}
              disabled={disabled}
              placeholder={allowEmbed ? "粘贴 Bilibili / YouTube 链接或文件地址" : "https://…"}
              onChange={(event) => onChange(event.target.value)}
              className="h-8 font-admin-mono text-xs md:text-xs"
            />
          ) : null}
        </div>
      </div>
      <MediaPickerDialog
        kind={kind}
        accept={accept}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={value}
        onSelect={(url) => {
          onChange(url);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

function MediaPreview({ source, url, kind, poster, large }: { source: MediaSource; url: string; kind: MediaKind; poster?: string; large: boolean }) {
  const frame = "relative grid aspect-video w-full place-items-center overflow-hidden rounded-[3px] bg-admin-raised";

  if (source.kind === "empty") {
    const Icon = kind === "image" ? ImageOff : VideoOff;
    return (
      <div className={cn(frame, "border border-dashed border-admin-line-strong bg-transparent")}>
        <Icon aria-hidden="true" className="size-5 text-admin-fg-3" />
      </div>
    );
  }

  // 外部主机上的图片也按图片预览；外部视频只有直链文件才能用 <video> 播放
  const isExternalVideoFile = source.kind === "external" && VIDEO_FILE.test(url.split(/[?#]/, 1)[0] ?? "");
  const isVideoFile = source.kind === "library-video" || isExternalVideoFile || (source.kind === "local" && kind === "video");
  const isImageFile = source.kind === "library-image" || ((source.kind === "local" || source.kind === "external") && kind === "image");

  if (isImageFile) {
    return <div className={frame}><img src={url} alt="" className="size-full object-cover" /></div>;
  }

  if (isVideoFile) {
    return <VideoPreview url={url} poster={poster} large={large} className={frame} />;
  }

  if (source.kind === "bilibili") {
    return <div className={cn(frame, "bg-[#1a2433]")}><span className="font-admin-mono text-xs text-[#7fb4ff]">bilibili</span></div>;
  }

  const Icon = source.kind === "youtube" ? CirclePlay : source.kind === "library-file" ? File : Link2;
  return <div className={frame}><Icon aria-hidden="true" className="size-5 text-admin-fg-3" /></div>;
}

function VideoPreview({ url, poster, large, className }: { url: string; poster?: string; large: boolean; className: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState("");

  function play() {
    setPlaying(true);
    void videoRef.current?.play().catch(() => undefined);
  }

  return (
    <div className={className}>
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        muted
        playsInline
        preload="metadata"
        controls={large && playing}
        onLoadedMetadata={(event) => setDuration(formatMediaDuration(event.currentTarget.duration))}
        className="size-full object-cover"
      />
      {large && !playing ? (
        <>
          <button
            type="button"
            onClick={play}
            aria-label="播放预览"
            className="absolute inset-0 grid place-items-center bg-black/20 text-white transition-colors hover:bg-black/35 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-admin-accent"
          >
            <Play aria-hidden="true" className="size-6" />
          </button>
          {duration ? <span className="pointer-events-none absolute right-1.5 bottom-1.5 rounded-[3px] bg-black/70 px-1 font-admin-mono text-xs text-white">{duration}</span> : null}
        </>
      ) : null}
    </div>
  );
}
