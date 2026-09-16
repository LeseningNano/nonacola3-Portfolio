import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { WorksIntro } from "@/components/works-index/works-intro";
import { ShowreelFeature } from "@/components/works-index/showreel-feature";
import { SmoothScrollContainer } from "@/components/smooth-scroll-container";
import { WorksLanguageProvider } from "@/components/works-index/works-language-provider";
import { WorksLanguageToggle } from "@/components/works-index/works-language-toggle";
import { WorksPageCopy } from "@/components/works-index/works-page-copy";
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
    <SmoothScrollContainer className="min-h-screen bg-[#0a0a0a] text-white">
      <WorksLanguageProvider>
        <main className="mx-auto max-w-[1200px] px-5 pb-20 pt-28 sm:px-8 md:px-12 md:pt-36">
          <div className="flex justify-end" data-works-language-toggle="">
            <WorksLanguageToggle />
          </div>
          <WorksIntro>
            {showreel?.showreelUrl.trim() && (
              <div className="mt-12 md:mt-16">
                <ShowreelFeature
                  showreelUrl={showreel.showreelUrl}
                  videoType={normalizeShowreelType(showreel.videoType)}
                />
              </div>
            )}
          </WorksIntro>

          <WorksPageCopy selected={selected} groups={groups} email={siteConfig.email} />
        </main>
        <Footer />
      </WorksLanguageProvider>
    </SmoothScrollContainer>
  );
}
