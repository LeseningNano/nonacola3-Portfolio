import { PageSettings } from "@/components/admin/page-settings";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  const [hero, showreel] = await Promise.all([
    db.heroVideo.findUnique({ where: { id: "singleton" }, select: { blobUrl: true } }),
    db.showreel.findUnique({ where: { id: "singleton" }, select: { showreelUrl: true, videoType: true } }),
  ]);

  return <PageSettings initialHeroUrl={hero?.blobUrl ?? ""} initialShowreel={{ url: showreel?.showreelUrl ?? "", videoType: showreel?.videoType === "upload" ? "upload" : "url" }} />;
}
