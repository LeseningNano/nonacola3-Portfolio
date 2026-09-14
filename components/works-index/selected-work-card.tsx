import Image from "next/image";
import { Play } from "lucide-react";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import {
  createThumbnailProxyPath,
  getSelectedWorkOrientation,
} from "@/lib/works-index";
import type { VideoRow } from "@/lib/types";

interface SelectedWorkCardProps {
  work: VideoRow;
  index: number;
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4rem_1fr] gap-4 text-sm">
      <dt className="text-neutral-400">{label}</dt>
      <dd className="text-neutral-300">{value}</dd>
    </div>
  );
}

export function SelectedWorkCard({ work, index }: SelectedWorkCardProps) {
  const orientation = getSelectedWorkOrientation(index);
  const desktopColumns =
    orientation === "media-right"
      ? "md:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.55fr)]"
      : "md:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.85fr)]";
  const role = work.role?.trim();
  const tools = work.tools?.trim();
  const summary = work.summary?.trim();
  const thumbnail = work.thumbnail
    ? createThumbnailProxyPath(work.thumbnail) ?? work.thumbnail
    : null;

  return (
    <IntentPrefetchLink
      href={`/works/${work.id}`}
      aria-label={`View case study: ${work.title}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <article className={`grid gap-5 ${desktopColumns} md:items-center md:gap-10 lg:gap-16`}>
        <div className={orientation === "media-right" ? "md:order-2" : undefined}>
          <div data-vt-id={work.id} className="relative aspect-video overflow-hidden bg-neutral-900">
            {thumbnail ? (
              <>
                <Image
                  src={thumbnail}
                  alt={work.title}
                  fill
                  unoptimized={thumbnail.startsWith("/media/thumbnail")}
                  sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 767px) calc(100vw - 64px), (max-width: 1023px) calc(65vw - 91px), (max-width: 1199px) calc(65vw - 108px), 672px"
                  className="object-cover transition-transform duration-500 motion-reduce:transition-none md:group-hover:scale-[1.03] md:group-focus-visible:scale-[1.03]"
                />
                <span className="absolute inset-0 bg-black/10 transition-colors duration-300 motion-reduce:transition-none md:group-hover:bg-black/0 md:group-focus-visible:bg-black/0" />
              </>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                <Play aria-hidden="true" className="h-10 w-10 text-neutral-600" />
              </span>
            )}
          </div>
        </div>
        <div className={orientation === "media-right" ? "md:order-1" : undefined}>
          <h3 className="text-2xl md:text-3xl">{work.title}</h3>
          <p className="mt-1 text-sm text-neutral-400">{work.category}</p>
          {(role || tools) && (
            <dl className="mt-5 space-y-2">
              {role && <Metadata label="Role" value={role} />}
              {tools && <Metadata label="Tools" value={tools} />}
            </dl>
          )}
          {summary && (
            <p className="mt-5 max-w-xl text-sm leading-6 text-neutral-400">{summary}</p>
          )}
          <p className="mt-5 text-sm text-neutral-300">
            View Case Study{" "}
            <span className="inline-block transition-transform duration-300 motion-reduce:transition-none md:group-hover:translate-x-1 md:group-focus-visible:translate-x-1">
              →
            </span>
          </p>
        </div>
      </article>
    </IntentPrefetchLink>
  );
}
