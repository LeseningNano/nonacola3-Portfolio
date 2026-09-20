import type { Video } from "@/lib/types";

export type AdminWork = Video;

type PrismaAdminWork = Omit<Video, "date" | "createdAt" | "updatedAt"> & {
  date: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export function serializeAdminWork(work: PrismaAdminWork): Video {
  return {
    ...work,
    date: work.date?.toISOString() ?? null,
    createdAt: work.createdAt?.toISOString() ?? "",
    updatedAt: work.updatedAt?.toISOString() ?? "",
  };
}

export function filterAdminWorks(
  works: Video[],
  query: string,
  featuredOnly: boolean,
): Video[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return works.filter((work) => {
    if (featuredOnly && !work.featured) return false;
    if (!normalizedQuery) return true;

    return [work.title, work.category].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery),
    );
  });
}
