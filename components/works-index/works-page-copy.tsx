"use client";

import { WorkArchive } from "./work-archive";
import { SelectedWorksReel } from "./selected-works-reel";
import { useWorksLanguage } from "./works-language-provider";
import { useLocaleFade } from "./use-locale-fade";
import { SectionHeading } from "@/components/section-heading";
import type { WorkYearGroup } from "@/lib/works-index";
import type { VideoRow } from "@/lib/types";

interface WorksPageCopyProps {
  selected: VideoRow[];
  groups: WorkYearGroup[];
  email: string;
}

// /works 的固定文案区块（Selected Works / All Works / Contact）。
// 作品数据由服务端页面计算后作为可序列化 props 传入，本组件不做任何数据请求。
export function WorksPageCopy({ selected, groups, email }: WorksPageCopyProps) {
  const { copy } = useWorksLanguage();
  const fade = useLocaleFade();

  return (
    <>
      {selected.length > 0 && (
        <section aria-labelledby="selected-works-heading" className="mt-24 md:mt-32">
          <SelectedWorksReel
            works={selected}
            header={
              <>
                <SectionHeading
                  id="selected-works-heading"
                  title="selected."
                  subtitle={copy.selected.heading}
                  subtitleRef={fade}
                />
                <p ref={fade} className="mt-3 max-w-xl text-sm leading-6 text-neutral-400 md:text-base">
                  {copy.selected.description}
                </p>
              </>
            }
          />
        </section>
      )}

      <section aria-labelledby="all-works-heading" className="mt-24 md:mt-32">
        <SectionHeading
          id="all-works-heading"
          title="archive."
          subtitle={copy.archive.heading}
          subtitleRef={fade}
        />
        <div className="mt-8 md:mt-10">
          {groups.length > 0 ? (
            <WorkArchive groups={groups} />
          ) : (
            <p ref={fade} className="text-neutral-400">{copy.archive.empty}</p>
          )}
        </div>
      </section>

      <section aria-labelledby="contact-heading" className="mt-24 border-t border-white/10 pt-8 md:mt-32">
        <p ref={fade} className="text-xs tracking-[0.24em] text-neutral-400">{copy.contact.eyebrow}</p>
        <h2 id="contact-heading" ref={fade} className="mt-4 text-4xl tracking-tight md:text-6xl">{copy.contact.heading}</h2>
        <a href={`mailto:${email}`} className="mt-7 inline-block text-neutral-300 underline decoration-neutral-700 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          {email}
        </a>
      </section>
    </>
  );
}
