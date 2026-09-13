# Works Index MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated `/works` hiring portfolio that leads with positioning and showreel, explains selected projects with Role and Tools, and presents the full archive by year without changing the homepage Works section.

**Architecture:** Keep `/works` as a statically rendered Server Component that reads the existing cached `getVideos()` and `getShowreel()` sources. Add only the approved nullable `role` and `tools` columns, isolate deterministic selection/grouping in a tested helper, and keep the only new client state inside an on-demand showreel player. Reuse the current intent-prefetch link and covered work transition for all case-study links.

**Tech Stack:** Next.js 16.2.9 App Router, React 19, TypeScript, Tailwind CSS 4, Prisma 7/PostgreSQL, Zod 4, Node test runner via `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-13-works-index-mvp-design.md`

## Global Constraints

- Create a dedicated `/works` route; do not redesign or edit the homepage Works section.
- Preserve the existing `/works/[id]` case studies, related-work logic, page-transition behavior, database architecture, and video hosting.
- Add only nullable `role` and `tools` work metadata; no other schema fields.
- Render `/works` with `dynamic = "force-static"` and `revalidate = 300`.
- Load no project-card preview videos and instantiate the showreel media only after activation.
- Use `public/hero-poster.webp` as the MVP showreel poster; do not add a showreel-poster database field.
- Use `Image preload` rather than the deprecated Next.js 16 `priority` prop.
- Do not eager-prefetch every case study; reuse `IntentPrefetchLink`.
- Selected Works uses every record with `featured === true`; three is the intended editorial count, not a hard cap.
- Years sort descending and undated work appears in an `Other` group last.
- Keep the current dark visual language, global navigation styling, and reduced-motion behavior.

## File Structure

- `app/works/page.tsx` — server-side route orchestration, metadata, data serialization, and section composition.
- `components/works-index/showreel-feature.tsx` — the only new client component; poster-to-media activation.
- `components/works-index/selected-work-card.tsx` — editorial Selected Works card.
- `components/works-index/work-archive.tsx` — compact year-grouped archive rendering.
- `lib/works-index.ts` — pure featured selection, year grouping, and showreel type normalization.
- `tests/works-index.test.ts` — deterministic tests for selection, grouping, and normalization.
- Existing schema, API, type, admin form, and navbar files receive narrow extensions only.

---

### Task 1: Persist Role and Tools Metadata

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260913000100_add_video_role_tools/migration.sql`
- Modify: `lib/types.ts`
- Modify: `lib/schemas.ts`
- Modify: `app/api/videos/route.ts`
- Modify: `app/api/videos/[id]/route.ts`
- Modify: `components/admin/video-form.tsx`
- Modify: `app/(admin)/videos/[id]/edit/page.tsx`
- Modify: `app/page.tsx`
- Modify: `app/works/[id]/page.tsx`
- Modify: `package.json`
- Create: `tests/video-metadata.test.ts`

**Interfaces:**
- Consumes: the existing `Video` Prisma model, `VideoRow`, create/update Zod schemas, and admin create/edit flow.
- Produces: nullable Prisma fields `role: string | null` and `tools: string | null`, matching serialized `Video`/`VideoRow` properties, and validated API payloads capped at 200 characters.

- [ ] **Step 1: Add the minimal TypeScript test runner**

Run:

```powershell
npm install --save-dev tsx
```

Add this script to `package.json`:

```json
"test": "tsx --test tests/**/*.test.ts"
```

- [ ] **Step 2: Write failing schema tests for both metadata fields**

Create `tests/video-metadata.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { videoCreateSchema, videoUpdateSchema } from "../lib/schemas";

const requiredVideo = {
  title: "Numb Numb PV",
  category: "Virtual Singer Cover PV",
  embedUrl: "https://example.com/video",
};

test("create accepts optional role and tools", () => {
  const result = videoCreateSchema.parse({
    ...requiredVideo,
    role: "Motion Design / Compositing",
    tools: "After Effects · Blender",
  });
  assert.equal(result.role, "Motion Design / Compositing");
  assert.equal(result.tools, "After Effects · Blender");
});

test("update accepts explicit null and rejects oversized metadata", () => {
  assert.deepEqual(videoUpdateSchema.parse({ role: null, tools: null }), {
    role: null,
    tools: null,
  });
  assert.equal(videoUpdateSchema.safeParse({ role: "x".repeat(201) }).success, false);
  assert.equal(videoUpdateSchema.safeParse({ tools: "x".repeat(201) }).success, false);
});
```

- [ ] **Step 3: Run the focused test and confirm it fails**

Run:

```powershell
npm test -- tests/video-metadata.test.ts
```

Expected: FAIL because `role` and `tools` are stripped or unavailable in the parsed result.

- [ ] **Step 4: Add the nullable database fields and explicit migration**

Add to `model Video` after `summary`:

```prisma
role        String?
tools       String?
```

Create `prisma/migrations/20260913000100_add_video_role_tools/migration.sql`:

```sql
ALTER TABLE "Video"
ADD COLUMN "role" TEXT,
ADD COLUMN "tools" TEXT;
```

Do not run `prisma migrate dev`; the migration file is deterministic and must not mutate production data during implementation.

- [ ] **Step 5: Extend shared types and input validation**

Add to both `Video` and `VideoRow` in `lib/types.ts`:

```ts
role: string | null;
tools: string | null;
```

Add to both `videoCreateSchema` and `videoUpdateSchema` in `lib/schemas.ts`:

```ts
role: z.string().max(200).nullish(),
tools: z.string().max(200).nullish(),
```

- [ ] **Step 6: Persist the fields in create and partial-update APIs**

Add to `POST /api/videos` data:

```ts
role: b.role ?? null,
tools: b.tools ?? null,
```

Add to `PUT /api/videos/[id]` data using the existing partial-update convention:

```ts
...(b.role !== undefined && { role: b.role }),
...(b.tools !== undefined && { tools: b.tools }),
```

- [ ] **Step 7: Add Role and Tools to the admin form**

Extend `VideoData`, initial form state, and edit-page `initialData` with string fields:

```ts
role: string;
tools: string;
```

Render two optional inputs immediately after Category:

```tsx
<div className="space-y-2">
  <Label htmlFor="role">职责（选填）</Label>
  <Input
    id="role"
    maxLength={200}
    value={form.role}
    onChange={(event) => setForm({ ...form, role: event.target.value })}
    placeholder="如：Motion Design / Compositing"
    className="bg-neutral-800 border-neutral-700"
  />
</div>
<div className="space-y-2">
  <Label htmlFor="tools">工具（选填）</Label>
  <Input
    id="tools"
    maxLength={200}
    value={form.tools}
    onChange={(event) => setForm({ ...form, tools: event.target.value })}
    placeholder="如：After Effects · Blender"
    className="bg-neutral-800 border-neutral-700"
  />
</div>
```

Initialize absent values to `""`; the API may store an empty string, and the public UI treats empty strings as absent.

- [ ] **Step 8: Keep every existing `VideoRow` serialization type-safe**

In `app/page.tsx` and `app/works/[id]/page.tsx`, add:

```ts
role: v.role,
tools: v.tools,
```

This is a data-shape update only; do not render the new values on the homepage or existing case-study page.

- [ ] **Step 9: Generate Prisma Client and run focused verification**

Run:

```powershell
npx prisma validate
npx prisma generate
npm test -- tests/video-metadata.test.ts
npx tsc --noEmit
```

Expected: all commands PASS. No database migration is applied locally or remotely in this step.

- [ ] **Step 10: Review and commit Task 1**

Review only the listed files, run `git diff --check`, and confirm homepage JSX did not change beyond serialization. Then commit:

```powershell
git add -- package.json package-lock.json prisma/schema.prisma prisma/migrations/20260913000100_add_video_role_tools/migration.sql lib/types.ts lib/schemas.ts app/api/videos/route.ts ':(literal)app/api/videos/[id]/route.ts' components/admin/video-form.tsx ':(literal)app/(admin)/videos/[id]/edit/page.tsx' app/page.tsx ':(literal)app/works/[id]/page.tsx' tests/video-metadata.test.ts
git commit -m "feat: add work role and tools metadata"
```

---

### Task 2: Add Tested Works Index View-Model Helpers

**Files:**
- Create: `lib/works-index.ts`
- Create: `tests/works-index.test.ts`

**Interfaces:**
- Consumes: `VideoRow[]` from `lib/types.ts` and the Prisma `Showreel.videoType` string.
- Produces: `selectFeaturedWorks(videos: VideoRow[]): VideoRow[]`, `groupWorksByYear(videos: VideoRow[]): WorkYearGroup[]`, `normalizeShowreelType(value: string | null | undefined): "url" | "upload"`, and `WorkYearGroup = { label: string; works: VideoRow[] }`.

- [ ] **Step 1: Write failing helper tests**

Create `tests/works-index.test.ts` with a typed fixture factory and these exact expectations:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import type { VideoRow } from "../lib/types";
import {
  groupWorksByYear,
  normalizeShowreelType,
  selectFeaturedWorks,
} from "../lib/works-index";

function work(id: string, date: string | null, featured = false): VideoRow {
  return {
    id,
    title: id,
    description: null,
    summary: null,
    role: null,
    tools: null,
    category: "PV",
    embedUrl: "https://example.com/video",
    thumbnail: null,
    featured,
    order: 0,
    date,
  };
}

test("selected works preserves source order and has no hard cap", () => {
  const videos = [work("a", null, true), work("b", null), work("c", null, true), work("d", null, true), work("e", null, true)];
  assert.deepEqual(selectFeaturedWorks(videos).map(({ id }) => id), ["a", "c", "d", "e"]);
});

test("archive groups dated work newest-first and places undated work last", () => {
  const groups = groupWorksByYear([
    work("2025-a", "2025-03-01T00:00:00.000Z"),
    work("other", null),
    work("2026", "2026-01-01T00:00:00.000Z"),
    work("2025-b", "2025-01-01T00:00:00.000Z"),
  ]);
  assert.deepEqual(groups.map(({ label }) => label), ["2026", "2025", "Other"]);
  assert.deepEqual(groups[1].works.map(({ id }) => id), ["2025-a", "2025-b"]);
});

test("showreel type accepts upload and falls back to url", () => {
  assert.equal(normalizeShowreelType("upload"), "upload");
  assert.equal(normalizeShowreelType("url"), "url");
  assert.equal(normalizeShowreelType("unexpected"), "url");
  assert.equal(normalizeShowreelType(undefined), "url");
});
```

- [ ] **Step 2: Run the helper tests and confirm they fail**

Run:

```powershell
npm test -- tests/works-index.test.ts
```

Expected: FAIL because `lib/works-index.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure helpers**

Create `lib/works-index.ts`:

```ts
import type { VideoRow } from "@/lib/types";

export interface WorkYearGroup {
  label: string;
  works: VideoRow[];
}

export function selectFeaturedWorks(videos: VideoRow[]): VideoRow[] {
  return videos.filter((video) => video.featured);
}

export function groupWorksByYear(videos: VideoRow[]): WorkYearGroup[] {
  const dated = new Map<number, VideoRow[]>();
  const other: VideoRow[] = [];

  for (const video of videos) {
    if (!video.date) {
      other.push(video);
      continue;
    }
    const year = new Date(video.date).getUTCFullYear();
    const group = dated.get(year) ?? [];
    group.push(video);
    dated.set(year, group);
  }

  const groups = [...dated.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, works]) => ({ label: String(year), works }));

  if (other.length > 0) groups.push({ label: "Other", works: other });
  return groups;
}

export function normalizeShowreelType(
  value: string | null | undefined
): "url" | "upload" {
  return value === "upload" ? "upload" : "url";
}
```

- [ ] **Step 4: Run helper verification**

Run:

```powershell
npm test -- tests/works-index.test.ts
npx tsc --noEmit
git diff --check
```

Expected: all PASS.

- [ ] **Step 5: Review and commit Task 2**

Confirm the helpers do not sort works inside a year and do not cap featured works. Commit:

```powershell
git add lib/works-index.ts tests/works-index.test.ts
git commit -m "test: define works index grouping"
```

---

### Task 3: Build the On-Demand Showreel Feature

**Files:**
- Create: `components/works-index/showreel-feature.tsx`

**Interfaces:**
- Consumes: `showreelUrl: string`, `videoType: "url" | "upload"`, `public/hero-poster.webp`, and `getEmbedUrl()`.
- Produces: `<ShowreelFeature showreelUrl={string} videoType={"url" | "upload"} />`; no fetch and no media element/iframe before activation.

- [ ] **Step 1: Create the client component with poster-only initial state**

Implement `components/works-index/showreel-feature.tsx` with:

```tsx
"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";
import { getEmbedUrl } from "@/lib/utils";

interface ShowreelFeatureProps {
  showreelUrl: string;
  videoType: "url" | "upload";
}

export function ShowreelFeature({ showreelUrl, videoType }: ShowreelFeatureProps) {
  const [active, setActive] = useState(false);
  const embedSrc = getEmbedUrl(showreelUrl);
  const separator = embedSrc.includes("?") ? "&" : "?";

  return (
    <section aria-labelledby="showreel-heading" className="border-t border-white/10 pt-6 md:pt-8">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.28em] text-neutral-500">SHOWREEL 2026</p>
          <h2 id="showreel-heading" className="mt-2 text-xl text-white md:text-2xl">
            Motion Design / PV / Compositing / 3D
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">
            A collection of motion design, PV and visual experiments.
          </p>
        </div>
        <p className="text-sm tabular-nums text-neutral-500">01:03</p>
      </div>

      <div className="relative aspect-video overflow-hidden bg-black">
        {active ? (
          videoType === "upload" ? (
            <video src={showreelUrl} controls autoPlay playsInline className="h-full w-full object-contain" />
          ) : (
            <iframe
              src={`${embedSrc}${separator}autoplay=1&mute=1&muted=1`}
              title="Showreel 2026"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          )
        ) : (
          <button
            type="button"
            aria-label="Play Showreel 2026"
            onClick={() => setActive(true)}
            className="group absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
          >
            <Image
              src="/hero-poster.webp"
              alt=""
              fill
              preload
              sizes="(max-width: 1248px) 100vw, 1200px"
              className="object-cover transition-transform duration-500 motion-reduce:transition-none md:group-hover:scale-[1.015]"
            />
            <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/15" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/60 bg-black/35 backdrop-blur-sm transition-transform duration-300 motion-reduce:transition-none md:group-hover:scale-105">
                <Play aria-hidden="true" className="ml-1 h-6 w-6 fill-white text-white" />
              </span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run static verification**

Run:

```powershell
npx tsc --noEmit
git diff --check
```

Expected: PASS. Review the initial JSX branch and confirm it contains neither `<video>` nor `<iframe>` when `active === false`.

- [ ] **Step 3: Review and commit Task 3**

Confirm there is no `/api/showreel` client fetch, autoplay card media, modal, or new schema. Commit:

```powershell
git add components/works-index/showreel-feature.tsx
git commit -m "feat: add on-demand works showreel"
```

---

### Task 4: Build the Selected and Archive Presentation

**Files:**
- Create: `components/works-index/selected-work-card.tsx`
- Create: `components/works-index/work-archive.tsx`
- Create: `app/works/page.tsx`

**Interfaces:**
- Consumes: `VideoRow`, `WorkYearGroup`, `ShowreelFeature`, `IntentPrefetchLink`, `siteConfig.email`, `selectFeaturedWorks()`, `groupWorksByYear()`, `normalizeShowreelType()`, `getVideos()`, and `getShowreel()`.
- Produces: the complete static `/works` route with the five approved sections and links to `/works/[id]`.

- [ ] **Step 1: Build the editorial Selected Work card**

Create `components/works-index/selected-work-card.tsx`:

```tsx
import Image from "next/image";
import { Play } from "lucide-react";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import type { VideoRow } from "@/lib/types";

interface SelectedWorkCardProps {
  work: VideoRow;
  dominant?: boolean;
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[4rem_1fr] gap-4 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-300">{value}</dd>
    </div>
  );
}

export function SelectedWorkCard({ work, dominant = false }: SelectedWorkCardProps) {
  const role = work.role?.trim();
  const tools = work.tools?.trim();

  return (
    <IntentPrefetchLink
      href={`/works/${work.id}`}
      aria-label={`View case study: ${work.title}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <article>
        <div data-vt-id={work.id} className="relative aspect-video overflow-hidden bg-neutral-900">
          {work.thumbnail ? (
            <>
              <Image
                src={work.thumbnail}
                alt={work.title}
                fill
                sizes={dominant ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                className="object-cover transition-transform duration-500 motion-reduce:transition-none md:group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-black/10 transition-colors duration-300 md:group-hover:bg-black/0" />
            </>
          ) : (
            <span className="absolute inset-0 flex items-center justify-center bg-neutral-900">
              <Play aria-hidden="true" className="h-10 w-10 text-neutral-600" />
            </span>
          )}
        </div>
        <div className={dominant ? "pt-5 md:grid md:grid-cols-2 md:gap-10" : "pt-4"}>
          <div>
            <h3 className={dominant ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"}>{work.title}</h3>
            <p className="mt-1 text-sm text-neutral-500">{work.category}</p>
          </div>
          <div className={dominant ? "mt-5 md:mt-0" : "mt-5"}>
            {(role || tools) && (
              <dl className="space-y-2">
                {role && <Metadata label="Role" value={role} />}
                {tools && <Metadata label="Tools" value={tools} />}
              </dl>
            )}
            <p className="mt-5 text-sm text-neutral-300 transition-colors group-hover:text-white">
              View Case Study →
            </p>
          </div>
        </div>
      </article>
    </IntentPrefetchLink>
  );
}
```

- [ ] **Step 2: Build the compact chronological archive**

Create `components/works-index/work-archive.tsx`:

```tsx
import Image from "next/image";
import { Play } from "lucide-react";
import { IntentPrefetchLink } from "@/components/intent-prefetch-link";
import type { WorkYearGroup } from "@/lib/works-index";

interface WorkArchiveProps {
  groups: WorkYearGroup[];
}

export function WorkArchive({ groups }: WorkArchiveProps) {
  return (
    <div className="space-y-16">
      {groups.map((group) => (
        <section key={group.label} aria-labelledby={`works-year-${group.label}`}>
          <h3 id={`works-year-${group.label}`} className="mb-5 text-sm tracking-[0.2em] text-neutral-500">
            {group.label}
          </h3>
          <div className="grid grid-cols-1 gap-x-4 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {group.works.map((work) => (
              <IntentPrefetchLink
                key={work.id}
                href={`/works/${work.id}`}
                aria-label={`View case study: ${work.title}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <article>
                  <div data-vt-id={work.id} className="relative aspect-video overflow-hidden bg-neutral-900">
                    {work.thumbnail ? (
                      <Image
                        src={work.thumbnail}
                        alt={work.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 motion-reduce:transition-none md:group-hover:scale-[1.025]"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Play aria-hidden="true" className="h-8 w-8 text-neutral-600" />
                      </span>
                    )}
                  </div>
                  <h4 className="mt-3 text-base text-neutral-100 transition-colors group-hover:text-white">
                    {work.title}
                  </h4>
                  <p className="mt-1 text-xs text-neutral-500">{work.category}</p>
                </article>
              </IntentPrefetchLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

Do not add Role, Tools, summary, filters, sorting controls, pagination, or video previews to this component.

- [ ] **Step 3: Compose the static `/works` server route**

Create `app/works/page.tsx` with route metadata and cache policy:

```tsx
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
          <p className="text-xs tracking-[0.28em] text-neutral-500">MOTION DESIGNER</p>
          <h1 className="mt-5 max-w-5xl text-4xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-5xl md:text-7xl">
            Motion Designer creating PV, game promotional visuals and cinematic motion graphics.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-neutral-400 md:text-lg">
            Focused on rhythm-driven editing, compositing and 3D visual storytelling with After Effects and Blender.
          </p>
          <dl className="mt-10 grid gap-5 border-y border-white/10 py-5 text-sm sm:grid-cols-2">
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-neutral-600">Location</dt>
              <dd className="text-neutral-300">China</dd>
            </div>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <dt className="text-neutral-600">Focus</dt>
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
            {groups.length > 0 ? <WorkArchive groups={groups} /> : <p className="text-neutral-500">Work is currently being updated.</p>}
          </div>
        </section>

        <section aria-labelledby="contact-heading" className="mt-24 border-t border-white/10 pt-8 md:mt-32">
          <p className="text-xs tracking-[0.24em] text-neutral-500">AVAILABLE FOR OPPORTUNITIES</p>
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
```

Do not add global CSS or modify existing homepage components.

- [ ] **Step 4: Run task-level verification**

Run:

```powershell
npm test
npx tsc --noEmit
npx next build --webpack
git diff --check
```

Expected: all PASS and build output contains both static `/works` and existing `/works/[id]` routes. The build command intentionally bypasses the package script's `prisma migrate deploy`; applying the migration is a deployment concern, not a local test side effect.

- [ ] **Step 5: Review and commit Task 4**

Review against the spec: Showreel precedes Selected, Selected precedes All, and Contact is last. Confirm no homepage file changed in this task. Commit:

```powershell
git add app/works/page.tsx components/works-index/selected-work-card.tsx components/works-index/work-archive.tsx
git commit -m "feat: add works portfolio index"
```

---

### Task 5: Integrate Navigation and Complete Browser Acceptance

**Files:**
- Modify: `components/navbar.tsx`
- Verify only: `components/video-grid.tsx`
- Verify only: `app/page.tsx`
- Verify only: `app/works/page.tsx`

**Interfaces:**
- Consumes: existing `pathname`, anchor-scroll handler, `/works`, global page transition, and production build.
- Produces: homepage-preserving navigation plus verified desktop/mobile/keyboard behavior.

- [ ] **Step 1: Make the WORKS menu destination path-aware**

Keep `SECTIONS` and the homepage anchor handler intact. Replace the body of both the mobile and desktop `SECTIONS.map` calls with this conditional, retaining the surrounding container:

```tsx
{SECTIONS.map((s, i) => {
  const className = "text-3xl py-2 text-neutral-300 hover:text-white transition-colors animate-fade-in opacity-0";
  const style = {
    fontFamily: "var(--font-bitcount)",
    animationDelay: `${i * 60}ms`,
  };

  if (s.id === "works" && pathname !== "/") {
    return (
      <Link key={s.id} href="/works" onClick={closeMenu} className={className} style={style}>
        {s.label}
      </Link>
    );
  }

  return (
    <a
      key={s.id}
      href={`/#${s.id}`}
      onClick={(event) => handleSectionClick(event, s.id)}
      className={className}
      style={style}
    >
      {s.label}
    </a>
  );
})}
```

For the desktop menu, add its existing `lg:text-4xl` token to the `className` constant. On `/`, WORKS keeps the existing anchor and `handleSectionClick(event, "works")`; on other routes, it becomes a Next.js link to `/works`. NEWS and ABOUT remain homepage anchors from every route. Preserve animation delays, menu-closing behavior, and visual style.

- [ ] **Step 2: Run the full automated gate**

Run:

```powershell
npm test
npx prisma validate
npx prisma generate
npx tsc --noEmit
npx next build --webpack
git diff --check
```

Expected: all PASS. Do not run `npm run build` locally because it applies pending migrations.

- [ ] **Step 3: Start the production build and verify desktop behavior**

Run the built app with `npm run start`, then use the browser at a representative viewport such as 1440×900. Verify:

- `/works` order is Positioning → Showreel → Selected → All → Contact.
- The page maxes out at 1200px and Selected uses one dominant plus supporting cards.
- Initial network requests contain no showreel upload/embed request and no batch `/works/<id>?_rsc=...` requests.
- Activating showreel inserts exactly one video/iframe request in place.
- Hovering one project starts only that case study's intent-prefetch request.
- Clicking Selected and All items reaches the correct existing `/works/[id]` page and retains the covered thumbnail transition.
- Returning to `/` shows the original homepage Works section with no markup or visual changes.

- [ ] **Step 4: Verify mobile and accessibility behavior**

At approximately 390×844, verify:

- No horizontal overflow.
- Heading remains readable and Showreel remains 16:9/touch-friendly.
- Selected cards are single-column and Role/Tools are visible without hover.
- Archive is one or two columns based on available width.
- Pointer-down intent prefetch does not trigger all case studies.

Using keyboard only, tab through showreel, every selected/archive link, contact, and menu. Confirm visible focus, sensible accessible names, and no hover-only essential information. Enable reduced motion and confirm scale transitions are suppressed.

- [ ] **Step 5: Review final diff and commit Task 5**

Confirm `git diff -- app/page.tsx components/video-grid.tsx components/works-marquee.tsx` is empty except Task 1's two serialization properties in `app/page.tsx`. Commit only the navbar integration:

```powershell
git add components/navbar.tsx
git commit -m "feat: link navigation to works index"
```

- [ ] **Step 6: Record deployment requirement without deploying**

Report that deployment must apply `20260913000100_add_video_role_tools` before the generated server code reads `role` and `tools`. Do not push, deploy, or run destructive production checks without a separate user request.

## Final Review Checklist

- [ ] Every requirement in `docs/superpowers/specs/2026-09-13-works-index-mvp-design.md` maps to Tasks 1–5.
- [ ] No homepage Works rendering component changed.
- [ ] No case-study, database cache, EdgeOne, Hero, or media-hosting behavior changed.
- [ ] Missing showreel, featured work, work records, thumbnails, Role, Tools, and dates all follow the specified edge states.
- [ ] The only runtime client state added is showreel activation; cards remain server-rendered with existing intent-prefetch links.
- [ ] All tests, TypeScript, Prisma validation/generation, production build, desktop review, mobile review, keyboard review, and network checks pass before completion is claimed.
