import { HeroVideo } from "@/components/hero-video";
import { ShowreelVideo } from "@/components/showreel-section";
import { VideoGrid } from "@/components/video-grid";
import { ContactSection } from "@/components/contact-section";
import { SectionNav } from "@/components/section-nav";

export default function Home() {
  return (
    <>
      <SectionNav />
      <main className="h-screen overflow-y-scroll">
        <HeroVideo />
        <ShowreelVideo />
        <VideoGrid />
        <ContactSection />
      </main>
    </>
  );
}
