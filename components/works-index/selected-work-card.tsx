import Image from "next/image";
import { Play } from "lucide-react";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import type { VideoRow } from "@/lib/types";

interface SelectedWorkCardProps {
  work: VideoRow;
  dominant?: boolean;
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4rem_1fr] gap-4 text-sm">
      <dt className="text-neutral-400">{label}</dt>
      <dd className="text-neutral-300">{value}</dd>
    </div>
  );
}

export function SelectedWorkCard({ work, dominant = false }: SelectedWorkCardProps) {
  const role = work.role?.trim();
  const tools = work.tools?.trim();
  const summary = work.summary?.trim();

  return (
    <IntentPrefetchLink
      href={`/works/${work.id}`}
      aria-label={`View case study: ${work.title}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <article>
        <div data-vt-id={work.id} className="relative aspect-video overflow-hidden bg-neutral-900">
          {work.thumbnail ? (
            <>
              <Image
                src={work.thumbnail}
                alt={work.title}
                fill
                sizes={dominant ? "(max-width: 639px) calc(100vw - 40px), (max-width: 767px) calc(100vw - 64px), (max-width: 1199px) calc(100vw - 96px), 1104px" : "(max-width: 639px) calc(100vw - 40px), (max-width: 767px) calc(100vw - 64px), (max-width: 1199px) calc(50vw - 58px), 542px"}
                className="object-cover transition-transform duration-500 motion-reduce:transition-none md:group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-black/10 transition-colors duration-300 md:group-hover:bg-black/0" />
            </>
          ) : (
            <span className="absolute inset-0 flex items-center justify-center bg-neutral-900">
              <Play aria-hidden="true" className="h-10 w-10 text-neutral-600" />
            </span>
          )}
        </div>
        <div className={dominant ? "pt-5 md:grid md:grid-cols-2 md:gap-10" : "pt-4"}>
          <div>
            <h3 className={dominant ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"}>{work.title}</h3>
            <p className="mt-1 text-sm text-neutral-400">{work.category}</p>
            {summary && (
              <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-400">{summary}</p>
            )}
          </div>
          <div className={dominant ? "mt-5 md:mt-0" : "mt-5"}>
            {(role || tools) && (
              <dl className="space-y-2">
                {role && <Metadata label="Role" value={role} />}
                {tools && <Metadata label="Tools" value={tools} />}
              </dl>
            )}
            <p className="mt-5 text-sm text-neutral-300 transition-colors group-hover:text-white">
              View Case Study →
            </p>
          </div>
        </div>
      </article>
    </IntentPrefetchLink>
  );
}
