import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { ShowreelFeature } from "@/components/works-index/showreel-feature";
import { SelectedWorkCard } from "@/components/works-index/selected-work-card";
import { WorkArchive } from "@/components/works-index/work-archive";
import { siteConfig } from "@/lib/config";
import { getShowreel, getVideos } from "@/lib/data";
import type { VideoRow } from "@/lib/types";
import {
  groupWorksByYear,
  normalizeShowreelType,
  selectFeaturedWorks,
} from "@/lib/works-index";

export const dynamic = "force-static";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Works",
  description: "Selected PV, motion design, compositing and 3D work by nonacola3.",
};

export default async function WorksPage() {
  const [records, showreel] = await Promise.all([getVideos(), getShowreel()]);
  const works: VideoRow[] = records.map((work) => ({
    id: work.id,
    title: work.title,
    description: work.description,
    summary: work.summary,
    role: work.role,
    tools: work.tools,
    category: work.category,
    embedUrl: work.embedUrl,
    thumbnail: work.thumbnail,
    featured: work.featured,
    order: work.order,
    date: work.date ? new Date(work.date).toISOString() : null,
  }));
  const selected = selectFeaturedWorks(works);
  const groups = groupWorksByYear(works);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <main className="mx-auto max-w-[1200px] px-5 pb-20 pt-28 sm:px-8 md:px-12 md:pt-36">
        <header>
          <p className="text-xs tracking-[0.28em] text-neutral-400">MOTION DESIGNER</p>
          <h1 className="mt-5 max-w-5xl text-4xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-5xl md:text-7xl">
            Motion Designer creating PV, game promotional visuals and cinematic motion graphics.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-neutral-400 md:text-lg">
            Focused on rhythm-driven editing, compositing and 3D visual storytelling with After Effects and Blender.
          </p>
          <dl className="mt-10 grid gap-5 border-y border-white/10 py-5 text-sm sm:grid-cols-2">
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-neutral-400">Location</dt>
              <dd className="text-neutral-300">China</dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-neutral-400">Focus</dt>
              <dd className="text-neutral-300">PV Production · Motion Graphics · Compositing · Blender</dd>
            </div>
          </dl>
        </header>

        {showreel?.showreelUrl.trim() && (
          <div className="mt-20 md:mt-28">
            <ShowreelFeature
              showreelUrl={showreel.showreelUrl}
              videoType={normalizeShowreelType(showreel.videoType)}
            />
          </div>
        )}

        {selected.length > 0 && (
          <section aria-labelledby="selected-works-heading" className="mt-24 border-t border-white/10 pt-7 md:mt-32">
            <h2 id="selected-works-heading" className="text-3xl tracking-tight md:text-5xl">Selected Works</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400 md:text-base">
              A selection of projects that represent my motion design workflow.
            </p>
            <div className="mt-10">
              <SelectedWorkCard work={selected[0]} dominant />
              {selected.length > 1 && (
                <div className="mt-14 grid grid-cols-1 gap-x-5 gap-y-14 md:grid-cols-2">
                  {selected.slice(1).map((work) => <SelectedWorkCard key={work.id} work={work} />)}
                </div>
              )}
            </div>
          </section>
        )}

        <section aria-labelledby="all-works-heading" className="mt-24 border-t border-white/10 pt-7 md:mt-32">
          <h2 id="all-works-heading" className="text-3xl tracking-tight md:text-5xl">All Works</h2>
          <div className="mt-10">
            {groups.length > 0 ? <WorkArchive groups={groups} /> : <p className="text-neutral-400">Work is currently being updated.</p>}
          </div>
        </section>

        <section aria-labelledby="contact-heading" className="mt-24 border-t border-white/10 pt-8 md:mt-32">
          <p className="text-xs tracking-[0.24em] text-neutral-400">AVAILABLE FOR OPPORTUNITIES</p>
          <h2 id="contact-heading" className="mt-4 text-4xl tracking-tight md:text-6xl">Let's work together.</h2>
          <a href={`mailto:${siteConfig.email}`} className="mt-7 inline-block text-neutral-300 underline decoration-neutral-700 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            {siteConfig.email}
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
