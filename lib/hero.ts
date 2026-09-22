export const DEFAULT_HERO_POSTER_URL = "/hero-poster.webp";

export function resolveHeroMedia(
  hero: { blobUrl: string; posterUrl?: string | null } | null,
): { blobUrl: string; posterUrl: string } | null {
  if (!hero) return null;
  return {
    blobUrl: hero.blobUrl,
    posterUrl: hero.posterUrl?.trim() || DEFAULT_HERO_POSTER_URL,
  };
}

export function createHeroPosterUpdate(posterUrl: string | null | undefined) {
  return posterUrl === undefined ? {} : { posterUrl: posterUrl?.trim() || null };
}
