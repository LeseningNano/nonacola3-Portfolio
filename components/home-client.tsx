"use client";

import { useEffect } from "react";
import { HeroVideo } from "@/components/hero-video";
import { VideoGrid } from "@/components/video-grid";
import { NewsSection } from "@/components/news-section";
import { AboutSection } from "@/components/about-section";
import { Footer } from "@/components/footer";
import type { VideoRow, PostItem } from "@/lib/types";
import {
  SCROLL_CONTAINER_ID,
  SmoothScrollContainer,
} from "@/components/smooth-scroll-container";

export function HomeClient({
  heroVideoUrl,
  videos,
  posts,
}: {
  heroVideoUrl: string | null;
  videos: VideoRow[];
  posts: PostItem[];
}) {
  // 从其他页面带锚点跳回主页时，滚动到目标板块
  useEffect(() => {
    const id = sessionStorage.getItem("pending-scroll");
    if (!id) return;
    sessionStorage.removeItem("pending-scroll");
    // 等渲染完成后计算位置
    setTimeout(() => {
      const container = document.getElementById("main-scroll");
      const el = document.getElementById(id);
      if (container && el) {
        container.dispatchEvent(
          new CustomEvent("smooth-scroll-to", { detail: { target: el.offsetTop } })
        );
      } else if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 300);
  }, []);

  return (
    <SmoothScrollContainer>
      <HeroVideo videoUrl={heroVideoUrl} />
      <VideoGrid videos={videos} />
      <NewsSection posts={posts} />
      <AboutSection />
      <Footer />
    </SmoothScrollContainer>
  );
}
