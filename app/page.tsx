import { HeroVideo } from "@/components/hero-video";
import { VideoGrid } from "@/components/video-grid";
import { ContactSection } from "@/components/contact-section";

export default function Home() {
  return (
    <main>
      <HeroVideo />
      <div id="works">
        <VideoGrid />
      </div>
      <div id="contact">
        <ContactSection />
      </div>
    </main>
  );
}
