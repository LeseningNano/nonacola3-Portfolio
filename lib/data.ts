import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const getVideos = unstable_cache(
  async () =>
    db.video.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
  ["videos"],
  { tags: ["videos"] }
);

export const getHero = unstable_cache(
  async () => db.heroVideo.findUnique({ where: { id: "singleton" } }),
  ["hero"],
  { tags: ["hero"] }
);

export const getShowreel = unstable_cache(
  async () => db.showreel.findUnique({ where: { showreelId: "showreelId" } }),
  ["showreel"],
  { tags: ["showreel"] }
);

export const getPosts = unstable_cache(
  async () => db.post.findMany({ orderBy: { createdAt: "desc" } }),
  ["posts"],
  { tags: ["posts"] }
);

export const getPost = unstable_cache(
  async (id: string) => db.post.findUnique({ where: { id } }),
  ["post"],
  { tags: ["posts"] }
);

export const getVideo = unstable_cache(
  async (id: string) => db.video.findUnique({ where: { id } }),
  ["video"],
  { tags: ["videos"] }
);
