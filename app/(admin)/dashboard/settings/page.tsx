import { PageSettings } from "@/components/admin/page-settings";
import { db } from "@/lib/db";
import { DEFAULT_HERO_POSTER_URL, resolveHeroMedia } from "@/lib/hero";

export default async function SettingsPage() {
  const [hero, showreel] = await Promise.all([
    db.heroVideo.findUnique({ where: { id: "singleton" }, select: { blobUrl: true, posterUrl: true } }),
    db.showreel.findUnique({ where: { id: "singleton" }, select: { showreelUrl: true, videoType: true } }),
  ]);
  const heroMedia = resolveHeroMedia(hero);

  return (
    <PageSettings
      initialHero={{
        videoUrl: heroMedia?.blobUrl ?? "",
        posterUrl: heroMedia?.posterUrl ?? DEFAULT_HERO_POSTER_URL,
      }}
      initialShowreel={{ url: showreel?.showreelUrl ?? "", videoType: showreel?.videoType === "upload" ? "upload" : "url" }}
    />
  );
}
