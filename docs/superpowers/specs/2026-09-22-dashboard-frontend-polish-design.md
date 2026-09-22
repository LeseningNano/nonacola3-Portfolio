# Dashboard Frontend Polish Design

**Date:** 2026-09-22

**Status:** Approved visual direction; awaiting written-spec review

**Scope:** Administrator Dashboard presentation and interaction hierarchy, plus administrator-managed Hero poster media

## 1. Purpose

Refine the completed Dashboard workflows into a coherent personal CMS that is fast to scan and pleasant to operate. The target is a restrained Linear/Vercel-style administration interface with balanced density: more structured and compact than the current implementation, but with enough space for portfolio thumbnails, media previews, and long-form editing.

The Dashboard remains a private tool for one administrator. It must prioritize clarity, editing speed, and reliable state feedback over decorative presentation.

## 2. Current Problems

The current implementation is functionally complete but visually reads as an intermediate assembly of components:

- Chinese and English interface labels are mixed without a deliberate language policy.
- Thin borders and near-identical dark cards give most sections the same visual weight.
- Lists use space inefficiently and do not form a consistent content-management pattern.
- The work editor repeats save actions and separates every group into another heavy card.
- Navigation, account actions, filters, status labels, and empty states do not yet share a unified visual grammar.
- Mobile layouts preserve functionality but are not sufficiently reorganized for touch and narrow screens.
- Hero video and its loading poster cannot be managed together from Page settings.

## 3. Approved Direction

- Use a Linear/Vercel-inspired administration structure rather than the cinematic public-site presentation.
- Use balanced density rather than an ultra-compact table.
- Keep the existing black, white, and neutral-gray palette.
- Use warm amber only for featured content, green for published/success states, muted gray for ordinary/inactive states, and red only for errors or destructive actions.
- Use one restrained radius scale, subtle borders, and minimal shadows.
- Keep functional motion limited to drawers, dialogs, menus, optimistic state changes, and reordering feedback.
- Use Chinese for interface actions and labels. Preserve authored work titles, categories, roles, tools, filenames, and other content exactly as stored.

## 4. Administration Shell

### Desktop

The shell uses a fixed sidebar approximately 196px wide and a full-width workspace.

The sidebar contains:

- Portfolio identity mark.
- A `内容` group with `作品` and `News`.
- A `网站` group with `页面设置` and `媒体库`.
- Administrator identity and account actions at the bottom.

Navigation items combine a small icon and visible label. The active item uses a quiet filled neutral surface rather than a bright white block. The workspace has a compact context bar for breadcrumb and future command/search affordances, followed by the page content.

### Mobile

The sidebar becomes a compact top bar and accessible drawer. Primary page actions stay visible without covering content. Lists reflow into two-line rows rather than relying on horizontal table scrolling. Touch targets remain at least approximately 44px where controls are not grouped into larger tappable rows.

## 5. Shared Visual and Interaction System

All Dashboard modules use the same primitives:

- Page heading: title, short description, optional count/status, and one primary action.
- Toolbar: quiet segmented filters on the left; search and secondary tools on the right.
- Content rows: subtle horizontal separators, hover/focus surface, primary text, secondary metadata, status badge, and an overflow menu.
- Status badges: the same bordered pill structure for every state. `精选` uses amber; `普通` uses neutral gray; `已发布` uses green; `草稿` uses muted warm gray.
- Buttons: one high-emphasis action per group; secondary actions use neutral borders; destructive actions remain in menus or confirmation dialogs.
- Fields: consistent height, border, label spacing, focus ring, help text, and error placement.
- Empty/loading/error states: placed within the content region and aligned to the same page grid; no oversized decorative cards.
- Save feedback: explicit clean, dirty, saving, saved, and error states with accessible live regions.

## 6. Works List

The Works list remains the default Dashboard destination.

Desktop rows display:

1. Thumbnail.
2. Title and role/tools summary.
3. Category.
4. Bordered status badge (`精选` or `普通`).
5. Updated date.
6. Overflow actions.

The page header contains `新建作品`. The toolbar contains All/Featured filters, search, and `调整顺序`. Preview, edit, and delete remain available, but frequent row interaction should open editing while secondary actions live in the overflow menu.

Mobile rows keep thumbnail, title, status, and the overflow action visible. Lower-priority metadata collapses beneath the title or is omitted from the row while remaining available in the editor.

## 7. Work Editor

### Desktop

The editor has one sticky action header, a continuous form column, and a sticky preview column.

The action header contains:

- Back to Works.
- Work title.
- Current save state.
- View public page.
- Save and return.
- One primary `保存更改` action.

The bottom duplicate save controls are removed.

The form uses section headings, short explanations, and horizontal separators rather than enclosing every section in a separate card. Sections remain:

1. Basic information.
2. Media.
3. Presentation information.
4. Case Study.

Media fields show the current preview, filename, type/size when available, and actions to replace or choose from the Media library. The preview column reproduces the public Works card only, updates with form state, and does not duplicate the entire Case Study page.

### Mobile

The sticky header reduces to the essential back, state, and save controls. The form appears first. The card preview becomes a clearly labeled collapsible section below it and remains reopenable after breakpoint changes.

## 8. News

News uses the same page header, toolbar, row system, overflow menu, and badge grammar as Works.

Rows show:

- Title or short-update opening text plus excerpt.
- Type badge (`文章` or `短动态`).
- State badge (`已发布` or `草稿`).
- Date.
- Overflow actions.

Article and short-update editors adopt the same continuous form layout and sticky save-state header as the Work editor. Article preview remains available without adding a separate unrelated visual system.

## 9. Page Settings

Page settings uses focused media groups rather than two large generic cards. Each group shows its purpose, current status, current preview, filename/source details, and replacement action.

### Hero background

Hero background has two independently managed assets:

- Background video.
- Poster image.

The poster is used before video playback is ready, when autoplay fails, and as the existing visual fallback. Each asset has its own preview and Media picker action. Selecting either asset changes only the local draft. One shared `保存更改` action publishes both values atomically. Save failure preserves both draft selections.

### Works Showreel

Showreel keeps its current uploaded-video and embed-link modes. It uses the same media row, source details, draft state, and save behavior as Hero without duplicating the complete Media library.

## 10. Hero Poster Data Change

The existing Hero poster is hardcoded as `/hero-poster.webp`. Making it replaceable requires a narrow data-contract extension:

- Add nullable `posterUrl` to the singleton `HeroVideo` record.
- Existing rows and environments continue to fall back to `/hero-poster.webp` when `posterUrl` is null or empty.
- Extend the Hero read result to return `blobUrl` and the effective poster URL.
- Extend the authenticated Hero update schema and endpoint to accept `blobUrl` and `posterUrl` together.
- Pass the effective poster URL into the public `HeroVideo` component instead of hardcoding the path.
- Add the poster URL to Media library reference protection so an active Hero poster cannot be deleted.
- Revalidate the same Hero cache tag/path after either value changes.

This is the only approved database-schema change in this project. The migration must be additive and must not rewrite existing production content.

## 11. Media Library

The Media library uses a responsive visual grid because the asset preview is the primary identifier.

Each asset shows:

- Image or video preview.
- Type.
- Filename.
- Size.
- Reference state.
- Contextual actions.

Filters remain All, Images, Videos, and Unused, with filename search and upload in the shared toolbar. Referenced assets show the content using them. Unused assets expose deletion only after the existing server-side reference recheck and confirmation. Storage usage appears as compact secondary information rather than a dominant dashboard metric.

## 12. Responsive Behavior

- Desktop layouts make full use of the remaining viewport after the sidebar.
- Tablet layouts may stack preview panels below editors before controls become cramped.
- Mobile lists use content rows rather than wide tables.
- Toolbars wrap into filters followed by full-width search and secondary actions.
- Media assets use two columns on typical phones and one column only when required by the available width.
- Essential actions never depend on hover.
- No sticky control may cover the mobile top bar or editable content.

## 13. Accessibility

- Preserve semantic navigation, headings, tables/lists where appropriate, fieldsets, labels, and button text.
- Keep visible focus states on every interactive control.
- Status color is always paired with visible text and badge structure.
- Menus, dialogs, Media picker, and the mobile drawer support keyboard operation, Escape, focus containment, and focus restoration.
- Save/upload/delete feedback uses polite status or assertive alert semantics according to severity.
- Reordering retains keyboard and mobile move controls.
- Respect reduced motion.

## 14. Technical Boundaries

- Preserve existing routes, authentication, authorization, Prisma access patterns, Vercel Blob integration, and public content behavior except for the approved dynamic Hero poster.
- Do not redesign the public portfolio.
- Do not add analytics, roles, collaboration, autosave, revisions, folders, bulk deletion, or a second UI framework.
- Reuse existing accessible UI primitives where appropriate, but centralize Dashboard-specific class patterns so pages do not independently reinvent rows, badges, fields, and toolbars.
- Read the installed Next.js 16 documentation before any framework-level implementation change.
- Never run the repository `npm run build` because it includes `prisma migrate deploy`; use `npx next build --webpack` for verification.
- Do not modify or destructively test production data or media.

## 15. Error and State Handling

- Existing unsaved-change protection remains active across sidebar navigation, browser unload, back actions, and sign out.
- Failed saves retain every form field and selected media draft.
- Media upload state stays separate from page/editor save state.
- Optimistic list mutations restore exact previous state on failure.
- Empty, loading, retry, success, and failure states use the shared page layout.
- Hero video and poster are saved as one logical settings update; partial client-side success is not displayed.

## 16. Verification

Automated verification must cover:

- Shared Dashboard layout and status variants.
- Works and News filtering and row actions.
- Editor dirty/saving/error/saved behavior after layout changes.
- Responsive preview behavior.
- Hero schema validation for video and poster.
- Legacy fallback to `/hero-poster.webp`.
- Hero poster rendering on the public homepage.
- Hero poster reference protection in the Media library.
- Failed Hero save retaining both selected assets.

Required checks:

- Repository tests.
- TypeScript.
- ESLint, without expanding scope to unrelated existing warnings.
- `git diff --check`.
- `npx next build --webpack`.
- Browser verification at representative desktop, tablet, and mobile widths.

Production data must not be changed during verification. Destructive Media-library verification requires isolated test storage and data.

## 17. Success Criteria

The refinement succeeds when:

- Every Dashboard module clearly belongs to one interface system.
- The primary action and current state are immediately visible on each screen.
- Lists scan quickly without looking like oversized spreadsheets.
- Work and News editing no longer feels like a stack of unrelated cards.
- Desktop space is used efficiently and mobile controls remain practical.
- Hero video and poster can be selected independently and saved together.
- Existing permissions, safe deletion rules, form preservation, and public-site behavior remain intact.
