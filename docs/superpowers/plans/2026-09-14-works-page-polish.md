# Works Page Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing `/works` MVP into a recruiter-first Motion Designer portfolio with a one-time word reveal, alternating selected case-study rows, a lightweight filmography index, and a media-first mobile layout.

**Architecture:** Keep `/works` as a statically rendered server page and isolate only the first-screen entrance sequence in one small client component. Put deterministic presentation decisions in `lib/works-index.ts` so they can be tested without adding a browser-component testing framework; retain existing data fetching, intent prefetch, thumbnail proxy, case-study routes, and global transition behavior.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4, Node test runner through `tsx`, Playwright CLI for runtime verification.

**Spec:** `docs/superpowers/specs/2026-09-14-works-page-polish-design.md`

## Global Constraints

- The headline text remains exactly `Motion Designer creating PV, game promotional visuals and cinematic motion graphics.`
- Highlight exactly `Motion Designer`, `PV`, `game promotional visuals`, and `cinematic motion graphics`; connecting words remain gray.
- The headline reveals word by word once per `/works` entry, followed by one simultaneous fade-in for the remaining first-screen content.
- Reduced-motion users receive all first-screen content immediately.
- Keep the current black-and-white visual language and approximately 1200-pixel content width.
- Do not modify the homepage Works section, database schema, public data structures, case-study routes, API routes, cache policy, EdgeOne configuration, Hero behavior, or global page-transition timing.
- Showreel remains poster-first and loads its player or full video only after activation.
- Existing intent-prefetch and same-origin thumbnail-proxy behavior remain in place.
- Do not run `npm run build`, because it includes `prisma migrate deploy`; validate with `npx next build --webpack`.
- Before modifying Next.js code, read the relevant files under `node_modules/next/dist/docs/` as required by `AGENTS.md`.
- Do not stage `.playwright-cli/`, `.superpowers/`, `HANDOFF.md`, or `tmp/`.

---

## File Structure

- Create `components/works-index/works-intro.tsx`: the only new client boundary; owns the one-time entrance sequence and wraps the existing Showreel as first-screen content.
- Create `components/works-index/works-intro.module.css`: owns opacity timing and the reduced-motion override without putting visibility in inline styles.
- Modify `app/works/page.tsx`: composes the recruiter-first intro, Showreel, alternating Selected Works, filmography archive, and Contact sections.
- Modify `components/works-index/selected-work-card.tsx`: renders an indexed alternating desktop row and consistent media-first mobile order.
- Modify `components/works-index/work-archive.tsx`: replaces the thumbnail grid with a semantic, year-grouped filmography list.
- Modify `components/works-index/showreel-feature.tsx`: accepts an optional class name only if composition needs it; it must retain poster-first activation behavior.
- Modify `lib/works-index.ts`: provides deterministic headline tokens, selected-row orientation, and globally numbered filmography entries.
- Modify `tests/works-index.test.ts`: covers every new presentation helper without introducing a test-only UI abstraction.

---

### Task 1: Deterministic Works Presentation Model

**Files:**
- Modify: `lib/works-index.ts`
- Test: `tests/works-index.test.ts`

**Interfaces:**
- Produces: `WORKS_HEADLINE: string`
- Produces: `WorksHeadlineToken { text: string; highlighted: boolean }`
- Produces: `getWorksHeadlineTokens(): WorksHeadlineToken[]`
- Produces: `getSelectedWorkOrientation(index: number): "media-left" | "media-right"`
- Produces: `FilmographyEntry { work: VideoRow; sequence: number }`
- Produces: `WorkFilmographyGroup { label: string; entries: FilmographyEntry[] }`
- Produces: `createFilmography(groups: WorkYearGroup[]): WorkFilmographyGroup[]`
- Consumes: existing `VideoRow` and `WorkYearGroup` types.

- [ ] **Step 1: Add failing tests for headline emphasis, row alternation, and continuous archive numbering**

Append tests equivalent to:

```ts
import {
  WORKS_HEADLINE,
  createFilmography,
  getSelectedWorkOrientation,
  getWorksHeadlineTokens,
} from "../lib/works-index";

test("keeps the approved works headline and highlights only recruiter keywords", () => {
  const tokens = getWorksHeadlineTokens();
  assert.equal(tokens.map((token) => token.text).join(" "), WORKS_HEADLINE);
  assert.equal(
    tokens.filter((token) => token.highlighted).map((token) => token.text).join("|"),
    "Motion|Designer|PV,|game|promotional|visuals|cinematic|motion|graphics."
  );
});

test("alternates selected work media from left to right", () => {
  assert.equal(getSelectedWorkOrientation(0), "media-left");
  assert.equal(getSelectedWorkOrientation(1), "media-right");
  assert.equal(getSelectedWorkOrientation(2), "media-left");
});

test("numbers filmography entries continuously across year groups", () => {
  const groups = [
    { label: "2026", works: [makeWork("one"), makeWork("two")] },
    { label: "2025", works: [makeWork("three")] },
  ];
  assert.deepEqual(
    createFilmography(groups).map((group) => group.entries.map((entry) => entry.sequence)),
    [[1, 2], [3]]
  );
});
```

Use the existing test fixture style in `tests/works-index.test.ts`; add a local `makeWork(id)` fixture only if the file does not already expose one.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
npx tsx --test tests/works-index.test.ts
```

Expected: failure because the four new exports do not exist.

- [ ] **Step 3: Implement the minimal pure presentation helpers**

Add these constants and functions to `lib/works-index.ts`:

```ts
export const WORKS_HEADLINE =
  "Motion Designer creating PV, game promotional visuals and cinematic motion graphics.";

const HIGHLIGHTED_WORDS = new Set([
  "Motion",
  "Designer",
  "PV,",
  "game",
  "promotional",
  "visuals",
  "cinematic",
  "motion",
  "graphics.",
]);

export interface WorksHeadlineToken {
  text: string;
  highlighted: boolean;
}

export function getWorksHeadlineTokens(): WorksHeadlineToken[] {
  return WORKS_HEADLINE.split(" ").map((text) => ({
    text,
    highlighted: HIGHLIGHTED_WORDS.has(text),
  }));
}

export function getSelectedWorkOrientation(
  index: number
): "media-left" | "media-right" {
  return index % 2 === 0 ? "media-left" : "media-right";
}

export interface FilmographyEntry {
  work: VideoRow;
  sequence: number;
}

export interface WorkFilmographyGroup {
  label: string;
  entries: FilmographyEntry[];
}

export function createFilmography(
  groups: WorkYearGroup[]
): WorkFilmographyGroup[] {
  let sequence = 0;
  return groups.map((group) => ({
    label: group.label,
    entries: group.works.map((work) => ({ work, sequence: ++sequence })),
  }));
}
```

- [ ] **Step 4: Run focused and full tests**

Run:

```powershell
npx tsx --test tests/works-index.test.ts
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Review and commit Task 1**

Run `git diff --check`, inspect only the two task files, then commit:

```powershell
git add -- lib/works-index.ts tests/works-index.test.ts
git commit -m "test: define works presentation model"
```

---

### Task 2: Recruiter-First Intro and One-Time Entrance

**Files:**
- Create: `components/works-index/works-intro.tsx`
- Create: `components/works-index/works-intro.module.css`
- Modify: `app/works/page.tsx`
- Test: `tests/works-index.test.ts` through the Task 1 headline contract

**Interfaces:**
- Consumes: `getWorksHeadlineTokens(): WorksHeadlineToken[]`
- Produces: `WorksIntro({ children }: { children: ReactNode })` React component.
- The server page keeps fetching the same `getVideos()` and `getShowreel()` data.

- [ ] **Step 1: Read relevant Next.js 16 documentation**

Read the App Router server/client component documentation under `node_modules/next/dist/docs/` and confirm that only `works-intro.tsx` requires `"use client"`.

- [ ] **Step 2: Create the client component with the approved animation contract**

Implement `components/works-index/works-intro.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { getWorksHeadlineTokens } from "@/lib/works-index";
import styles from "./works-intro.module.css";

export function WorksIntro({ children }: { children: ReactNode }) {
  const tokens = getWorksHeadlineTokens();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={entered ? styles.entered : undefined}>
      <header>
        <p className={`${styles.supporting} text-xs tracking-[0.28em] text-neutral-400`}>
          MOTION DESIGNER · CHINA
        </p>
        <div className="mt-5 grid gap-7 md:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] md:items-end md:gap-12">
          <h1
            aria-label={tokens.map((token) => token.text).join(" ")}
            className="text-4xl font-normal leading-[1.05] tracking-[-0.035em] sm:text-5xl md:text-6xl"
          >
            {tokens.map((token, index) => (
              <span
                key={`${token.text}-${index}`}
                aria-hidden="true"
                className={`${styles.word} ${token.highlighted ? "text-white" : "text-neutral-500"}`}
                style={{ "--word-index": index } as CSSProperties}
              >
                {token.text}{" "}
              </span>
            ))}
          </h1>
          <div className={styles.supporting}>
            <p className="text-sm leading-6 text-neutral-400 md:text-base">
              Available for motion design, compositing and promotional visual work.
            </p>
            <dl className="mt-5 space-y-2 border-y border-white/10 py-4 text-sm">
              <div className="grid grid-cols-[4rem_1fr] gap-3">
                <dt className="text-neutral-500">Focus</dt>
                <dd className="text-neutral-300">PV · Compositing · 3D</dd>
              </div>
              <div className="grid grid-cols-[4rem_1fr] gap-3">
                <dt className="text-neutral-500">Tools</dt>
                <dd className="text-neutral-300">After Effects · Blender</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>
      <div className={styles.supporting}>{children}</div>
    </div>
  );
}
```

Implement `works-intro.module.css` exactly around opacity state:

```css
.word {
  opacity: 0;
  transition: opacity 360ms ease;
  transition-delay: calc(var(--word-index) * 90ms);
}

.supporting {
  opacity: 0;
  transition: opacity 600ms ease;
  transition-delay: 1260ms;
}

.entered .word,
.entered .supporting {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .word,
  .supporting {
    opacity: 1;
    transition: none;
  }
}
```

The headline contains eleven words, so the final word begins after 900 milliseconds and completes its 360-millisecond fade at 1260 milliseconds. At that point, the eyebrow, supporting copy, metadata, and Showreel begin their shared fade. Keep Showreel inside the `children` region so it fades with the other supporting first-screen elements.

- [ ] **Step 3: Compose the new intro without changing data flow**

In `app/works/page.tsx`:

- import `WorksIntro`;
- replace the current inline `<header>` with `<WorksIntro>`;
- render the existing conditional `<ShowreelFeature>` block as the child of `<WorksIntro>` so all non-headline first-screen elements fade together;
- tighten the spacing before Showreel so it follows the recruiter-first composition;
- retain `dynamic = "force-static"`, `revalidate = 300`, `Promise.all`, and all existing fetches.

- [ ] **Step 4: Verify Task 2**

Run:

```powershell
npm test
npx tsc --noEmit
npx next build --webpack
```

Expected: tests, typecheck, and production build pass; `/works` remains statically generated with the existing revalidation period.

- [ ] **Step 5: Browser-check the intro contract**

In production mode, verify desktop and mobile:

- exact headline wording is unchanged;
- only approved phrases are white;
- words reveal in order;
- supporting elements fade together after the last word;
- the sequence does not replay while scrolling or interacting;
- leaving `/works` and entering it again starts a fresh sequence;
- reduced-motion shows all content immediately;
- Showreel still loads only after Play.

- [ ] **Step 6: Review and commit Task 2**

Run `git diff --check`, inspect only the Task 2 files, then commit:

```powershell
git add -- app/works/page.tsx components/works-index/works-intro.tsx components/works-index/works-intro.module.css
git commit -m "feat: refine works recruiter intro"
```

---

### Task 3: Alternating Selected Case-Study Rows

**Files:**
- Modify: `app/works/page.tsx`
- Modify: `components/works-index/selected-work-card.tsx`
- Test: `tests/works-index.test.ts` through `getSelectedWorkOrientation`

**Interfaces:**
- Consumes: `getSelectedWorkOrientation(index)`.
- Changes: `SelectedWorkCardProps` from `{ work, dominant? }` to `{ work, index }`.
- Retains: `IntentPrefetchLink`, `createThumbnailProxyPath`, `data-vt-id`, and the existing case-study URL.

- [ ] **Step 1: Change the card interface and desktop grid**

Update the component signature:

```tsx
interface SelectedWorkCardProps {
  work: VideoRow;
  index: number;
}
```

Use `getSelectedWorkOrientation(index)` to render every selected work as one row. The article should use a desktop grid equivalent to:

```tsx
<article className="grid gap-5 md:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.85fr)] md:items-center md:gap-10 lg:gap-16">
  <div className={orientation === "media-right" ? "md:order-2" : undefined}>
    {/* existing proxied 16:9 image and data-vt-id */}
  </div>
  <div className={orientation === "media-right" ? "md:order-1" : undefined}>
    {/* title, category, Role, Tools, summary, CTA */}
  </div>
</article>
```

On mobile, DOM order or responsive ordering must always present media first. Keep all metadata outside the image overlay. Preserve the existing focus ring, image alt text, reduced-motion image behavior, and thumbnail proxy fallback.

- [ ] **Step 2: Update the Selected Works composition**

In `app/works/page.tsx`, remove the dominant-first/smaller-pair branches and render one list:

```tsx
<div className="mt-10 space-y-20 md:mt-14 md:space-y-28">
  {selected.map((work, index) => (
    <SelectedWorkCard key={work.id} work={work} index={index} />
  ))}
</div>
```

Keep the existing section heading and description. Do not cap or reorder the selected records in the component; `selectFeaturedWorks` remains the source of selection and order.

- [ ] **Step 3: Run verification for Task 3**

Run:

```powershell
npx tsx --test tests/works-index.test.ts
npm test
npx tsc --noEmit
npx next build --webpack
```

Expected: all checks pass.

- [ ] **Step 4: Browser-check Selected Works**

Verify:

- desktop rows alternate media-left, media-right, media-left;
- mobile rows always show media before text;
- Role, Tools, summary, and CTA remain readable without hover;
- each image loads through the existing same-origin proxy when eligible;
- hover is limited to slight scale, overlay, and arrow movement;
- focus gives an equally visible state;
- clicking still reaches the same `/works/[id]` route and preserves the current global transition.

- [ ] **Step 5: Review and commit Task 3**

Run `git diff --check`, inspect only the Task 3 files, then commit:

```powershell
git add -- app/works/page.tsx components/works-index/selected-work-card.tsx
git commit -m "feat: present selected works as case rows"
```

---

### Task 4: Year-Grouped Filmography Index

**Files:**
- Modify: `app/works/page.tsx`
- Modify: `components/works-index/work-archive.tsx`
- Test: `tests/works-index.test.ts` through `createFilmography`

**Interfaces:**
- Consumes: `createFilmography(groups): WorkFilmographyGroup[]`.
- Retains: existing `WorkArchiveProps { groups: WorkYearGroup[] }` so the server-page call site remains stable.
- Removes from this component only: `next/image`, `Play`, and thumbnail-proxy usage.

- [ ] **Step 1: Replace archive thumbnails with semantic indexed rows**

In `work-archive.tsx`:

- remove `Image`, `Play`, and `createThumbnailProxyPath` imports;
- call `createFilmography(groups)` once;
- render each year as a section with its existing heading relationship;
- render entries in an ordered or unordered semantic list;
- keep each entire row as an `IntentPrefetchLink` to `/works/${work.id}`.

Use a row structure equivalent to:

```tsx
<li>
  <IntentPrefetchLink
    href={`/works/${work.id}`}
    className="group grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/10 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:grid-cols-[3rem_minmax(0,1fr)_minmax(10rem,0.35fr)_auto]"
  >
    <span className="text-xs tabular-nums text-neutral-500">
      {String(sequence).padStart(2, "0")}
    </span>
    <span className="min-w-0 text-sm text-neutral-200 transition-colors group-hover:text-white md:text-base">
      {work.title}
    </span>
    <span className="hidden text-sm text-neutral-500 md:block">
      {work.category}
    </span>
    <span aria-hidden="true" className="transition-transform motion-reduce:transition-none group-hover:translate-x-1">
      ↗
    </span>
  </IntentPrefetchLink>
</li>
```

On mobile, display category below the title inside the title column rather than removing it from the accessible content. Do not render any archive image.

- [ ] **Step 2: Adjust only the archive section spacing if needed**

In `app/works/page.tsx`, retain the heading and empty state. Adjust vertical spacing only enough to fit the lighter list treatment; do not change Selected Works or Contact in this step.

- [ ] **Step 3: Run verification for Task 4**

Run:

```powershell
npx tsx --test tests/works-index.test.ts
npm test
npx tsc --noEmit
npx next build --webpack
```

Expected: all checks pass, and the archive no longer imports or renders `next/image`.

- [ ] **Step 4: Browser-check the archive**

Verify:

- year groups remain newest-first according to existing data logic;
- numbering continues across years;
- rows show title, category, and arrow at desktop and mobile sizes;
- the whole row is clickable and keyboard focus is visible;
- selected projects may appear again but no duplicate thumbnail is downloaded;
- initial `/works` load produces no archive thumbnail requests and no bulk detail-route RSC requests.

- [ ] **Step 5: Review and commit Task 4**

Run `git diff --check`, inspect only the Task 4 files, then commit:

```powershell
git add -- app/works/page.tsx components/works-index/work-archive.tsx
git commit -m "feat: simplify all works into filmography"
```

---

### Task 5: Integrated Responsive and Regression Verification

**Files:**
- Modify only if a verified defect is directly caused by Tasks 1–4: the smallest responsible Works file
- Do not modify unrelated lint warnings or production configuration

**Interfaces:**
- Validates the completed `/works` implementation against the approved spec.

- [ ] **Step 1: Review the complete branch diff against the spec**

Confirm every changed line serves one of the approved requirements. Confirm no changes exist in homepage Works, global transitions, API routes, database files, EdgeOne configuration, or cache code.

- [ ] **Step 2: Run the full automated verification set**

Run:

```powershell
npm test
npx tsc --noEmit
npx next build --webpack
git diff --check
```

Expected: every command exits successfully.

- [ ] **Step 3: Run production-mode desktop verification**

Start the built app without touching production data and verify at a desktop viewport:

- exact word reveal and keyword emphasis;
- simultaneous supporting fade;
- recruiter-first first screen;
- poster-first Showreel activation;
- alternating Selected Works;
- filmography archive;
- intent prefetch remains user-driven;
- case-study navigation and current transition remain intact.

- [ ] **Step 4: Run production-mode mobile verification**

Verify at a representative narrow viewport:

- no horizontal overflow;
- readable headline wrapping;
- media-first Selected Works order;
- archive rows have usable touch targets and safe text wrapping;
- menu behavior remains unchanged;
- no hover-only information.

- [ ] **Step 5: Verify reduced motion and request behavior**

Emulate `prefers-reduced-motion: reduce` and confirm all intro content is immediately visible. Record the initial `/works` requests and confirm:

- no Showreel video/player request before Play;
- no All Works thumbnail requests;
- no bulk `/works/[id]` RSC prefetch requests;
- Selected Works images use the existing same-origin proxy when allowed.

- [ ] **Step 6: Fix only directly caused defects and repeat the failed check**

If a check fails, identify the responsible task, make the smallest correction in its Works file, rerun the focused failing check, then rerun the full automated verification set. Stop for user input if the correction requires changing an approved design or a global system.

- [ ] **Step 7: Commit final verification fixes only when needed**

If Step 6 changed files:

Stage only the responsible Works files confirmed in Step 6, choosing from this explicit set:

```powershell
git add -- app/works/page.tsx components/works-index/works-intro.tsx components/works-index/works-intro.module.css components/works-index/selected-work-card.tsx components/works-index/work-archive.tsx
git commit -m "fix: polish works responsive behavior"
```

If no files changed, do not create an empty verification commit.

---

## Completion Report

Report:

1. each task and its commit;
2. exact files changed;
3. focused tests, full tests, typecheck, and build results;
4. desktop, mobile, reduced-motion, Showreel, and network verification results;
5. any remaining limitations;
6. confirmation that no production data, homepage Works code, global transition, cache, database, API, or EdgeOne configuration was changed;
7. whether the branch is unpushed and ready for user review.
