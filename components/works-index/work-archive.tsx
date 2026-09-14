import Image from "next/image";
import { Play } from "lucide-react";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import type { WorkYearGroup } from "@/lib/works-index";

interface WorkArchiveProps {
  groups: WorkYearGroup[];
}

export function WorkArchive({ groups }: WorkArchiveProps) {
  return (
    <div className="space-y-16">
      {groups.map((group) => (
        <section key={group.label} aria-labelledby={`works-year-${group.label}`}>
          <h3 id={`works-year-${group.label}`} className="mb-5 text-sm tracking-[0.2em] text-neutral-400">
            {group.label}
          </h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {group.works.map((work) => (
              <IntentPrefetchLink
                key={work.id}
                href={`/works/${work.id}`}
                aria-label={`View case study: ${work.title}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <article>
                  <div data-vt-id={work.id} className="relative aspect-video overflow-hidden bg-neutral-900">
                    {work.thumbnail ? (
                      <Image
                        src={work.thumbnail}
                        alt={work.title}
                        fill
                        sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 767px) calc(50vw - 40px), (max-width: 1023px) calc(50vw - 56px), (max-width: 1199px) calc(33.333vw - 42.667px), 357.33px"
                        className="object-cover transition-transform duration-500 motion-reduce:transition-none md:group-hover:scale-[1.025]"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Play aria-hidden="true" className="h-8 w-8 text-neutral-600" />
                      </span>
                    )}
                  </div>
                  <h4 className="mt-3 text-base text-neutral-100 transition-colors group-hover:text-white">
                    {work.title}
                  </h4>
                  <p className="mt-1 text-xs text-neutral-400">{work.category}</p>
                </article>
              </IntentPrefetchLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
