import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import { createFilmography, type WorkYearGroup } from "@/lib/works-index";

interface WorkArchiveProps {
  groups: WorkYearGroup[];
}

export function WorkArchive({ groups }: WorkArchiveProps) {
  const filmography = createFilmography(groups);

  return (
    <div className="space-y-16">
      {filmography.map((group) => (
        <section key={group.label} aria-labelledby={`works-year-${group.label}`}>
          <h3 id={`works-year-${group.label}`} className="mb-5 text-sm tracking-[0.2em] text-neutral-400">
            {group.label}
          </h3>
          <ol>
            {group.entries.map(({ work, sequence }) => (
              <li key={work.id}>
                <IntentPrefetchLink
                  href={`/works/${work.id}`}
                  className="group grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/10 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:grid-cols-[3rem_minmax(0,1fr)_minmax(10rem,0.35fr)_auto]"
                >
                  <span className="text-xs tabular-nums text-neutral-500">
                    {String(sequence).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-neutral-200 transition-colors group-hover:text-white md:text-base">
                      {work.title}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500 md:hidden">
                      {work.category}
                    </span>
                  </span>
                  <span className="hidden text-sm text-neutral-500 md:block">
                    {work.category}
                  </span>
                  <span
                    aria-hidden="true"
                    className="transition-transform motion-reduce:transition-none group-hover:translate-x-1"
                  >
                    ↗
                  </span>
                </IntentPrefetchLink>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
