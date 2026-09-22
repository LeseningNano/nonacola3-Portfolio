# Portfolio Dashboard Redesign Design

**Date:** 2026-09-21

**Status:** Approved design

**Scope:** Administrator Dashboard only

## 1. Purpose

Redesign the Portfolio administrator Dashboard around the owner's actual task frequency:

1. Create and edit works.
2. Reorder works and manage featured status.
3. Create and edit News content.
4. Update Hero and Showreel media.

The redesign must make uploading media, editing content, checking the result, and returning to the content list feel like one continuous workflow. It is a focused personal CMS, not a general-purpose publishing platform.

## 2. Current Problems

The current `/dashboard` page places page settings, works management, and News management in one long vertical page. Works creation and editing then move to separate `/videos/*` routes, producing an inconsistent navigation model.

The main usability problems are:

- Uploading or choosing media is separated from understanding how the work card will appear.
- Saving provides insufficient visual confirmation of the resulting public presentation.
- Creating, editing, previewing, returning, and reordering require unnecessary navigation context switches.
- Work ordering relies on repeated up/down actions and saves each movement immediately.
- News creation, editing, and the content list share one crowded component.
- Hero and Showreel implement similar upload and Blob selection behavior independently.
- The Dashboard lacks a dedicated navigation shell and clear module boundaries.
- The centered `max-w-6xl` layout leaves excessive unused space on desktop screens.

## 3. Users and Constraints

- The Dashboard is primarily used by one administrator.
- Desktop is the primary management environment.
- Mobile must support occasional urgent edits, publishing, and ordering.
- Work saves continue to update the public site immediately; no work draft/publish workflow will be introduced.
- News retains its existing draft and published states.
- The existing public site design, routes, caching behavior, and content presentation must not be redesigned as part of this project.
- Existing Prisma, Neon PostgreSQL, Vercel Blob, NextAuth, and API authorization remain in place.
- Production data must not be modified during development or destructive testing.

## 4. Information Architecture

The Dashboard becomes a dedicated administration workspace:

```text
Dashboard
├─ Works
│  ├─ Work list (default Dashboard destination)
│  ├─ Create/edit work
│  └─ Reorder works
├─ News
│  ├─ Content list
│  ├─ Short update editor
│  └─ Markdown article editor
├─ Page settings
│  ├─ Hero
│  └─ Showreel
└─ Media library
   ├─ Browse/filter media
   ├─ Upload media
   └─ Safely delete unused media
```

Opening `/dashboard` takes the administrator directly to Works. There is no analytics or summary landing page because it would add a step before the most frequent task.

The preferred route structure is:

```text
/dashboard                         → redirect to /dashboard/works
/dashboard/works                   → work list
/dashboard/works/new               → create work
/dashboard/works/[id]/edit         → edit work
/dashboard/works/order             → ordering mode
/dashboard/news                    → News list
/dashboard/news/new                → choose/create content type
/dashboard/news/[id]/edit          → edit short update or article
/dashboard/settings                → Hero and Showreel
/dashboard/media                   → media library
```

Existing administrator URLs such as `/videos/new` and `/videos/[id]/edit` remain as compatibility redirects to the new routes so saved bookmarks do not break.

## 5. Admin Shell and Responsive Layout

### Desktop

- Use a dedicated fixed left sidebar approximately 176–208px wide.
- The main workspace fills the remaining viewport width.
- Use 24–32px horizontal workspace padding instead of a centered narrow maximum-width container.
- The sidebar contains Works, News, Page settings, Media library, View site, and Sign out.
- The active module is visually explicit.
- Public-site navigation must not compete with or duplicate the administration navigation.

### Mobile

- Replace the sidebar with a compact top bar and accessible navigation drawer.
- Use 16px content padding.
- Preserve every required management operation; mobile is not a read-only version.
- Desktop efficiency remains the primary layout priority.

## 6. Works List

The Works list is the default Dashboard screen.

It displays:

- Thumbnail.
- Title.
- Category.
- Featured state.
- Current ordering position.
- Last updated information when available.
- Preview and edit actions.

It supports:

- Search.
- All/featured filtering.
- Creating a work.
- Opening the public work page.
- Entering edit mode.
- Entering the dedicated ordering mode.

The regular list does not allow drag-and-drop, preventing accidental reordering during ordinary management.

## 7. Work Editor

### Desktop layout

The editor uses a full-width two-column layout:

- Left: the editing form.
- Right: a sticky live `/works` card preview.

The form is organized in this order:

1. Basic information: title, category, and date.
2. Media: current thumbnail, upload/replace, choose existing media, and video URL.
3. Presentation information: role, tools, summary, featured state, and order.
4. Case Study content: detailed Markdown content.

The preview reflects the public `/works` card presentation, including thumbnail, title, category, role, tools, summary, and CTA. It intentionally does not duplicate the complete `/works/[id]` detail page.

The fixed editor header contains:

- Back to Works.
- Saved/unsaved/saving/error status.
- View public page.
- Save.
- Save and return.

### Mobile layout

- The form appears first.
- The card preview moves below the form and can be collapsed.
- Save actions remain readily accessible without covering form fields.

### Behavior

- Work saves continue to update the public content immediately.
- The editor does not auto-save.
- Leaving with unsaved changes requires confirmation.
- Upload progress and form save status are separate states.
- Upload failures must not clear other form input.
- Save failures preserve all entered content.

## 8. Work Ordering and Featured Management

Ordering is an explicit mode launched from the Works list.

- Rows expose drag handles while ordering mode is active.
- Dragging updates only local state.
- A fixed action bar displays Cancel and Save order.
- The public order changes only after Save order succeeds.
- Up/down controls remain available for keyboard users and mobile devices.
- Rows expose clear numeric positions.
- Featured status may be adjusted in ordering mode and committed with the ordering change.
- Leaving with unsaved ordering changes requires confirmation.
- A failed save retains the local order and offers retry or cancel instead of silently reverting.

The existing reorder API remains the underlying write path unless implementation discovery proves it cannot safely support the approved behavior.

## 9. News Management

The News list manages short updates and Markdown articles together.

It supports:

- All, published, and draft filters.
- Search by title or body.
- Type, title/excerpt, tag, state, and date display.
- Preview, edit, publish/unpublish, and delete actions.

New content begins with an explicit choice:

- Short update.
- Markdown article.

### Short update

- Uses a lightweight editor rather than the full article interface.
- Contains body, optional tag, character feedback, Publish, and Save draft.

### Markdown article

- Uses a dedicated editor page.
- Contains title, optional tag, Markdown editing, and live rendered preview.
- Supports Publish and Save draft.

Both types retain the existing draft and published semantics and share API behavior for state changes and deletion.

## 10. Page Settings

Page settings contains two focused cards:

- Hero background video.
- Works Showreel.

Each card shows:

- Current status.
- Current media preview.
- File/source information.
- A Replace or Change source action.

The settings page does not display the entire media inventory. It opens the shared media picker for upload or selection.

## 11. Shared Media Picker

Hero, Showreel, and work thumbnail fields use one shared media picker instead of maintaining separate Blob selection implementations.

The picker supports:

- Uploading caller-approved file types: JPEG/PNG/WebP/GIF for work thumbnails, MP4 for Hero, and the video formats already accepted by Showreel.
- Displaying upload progress.
- Browsing existing files.
- Filtering by compatible media type.
- Previewing file name, size, and thumbnail/video preview.
- Selecting a file without immediately changing unrelated content.
- Clear loading, empty, failure, and retry states.

## 12. Media Library and Safe Deletion

The Media library displays:

- File preview.
- File name.
- Media type.
- Size.
- Usage/reference state.
- View and delete actions when permitted.

It supports All, Images, Videos, and Unused filters plus uploading new media.

### Reference protection

Before a file can be deleted, the server must check references in:

- `HeroVideo.blobUrl`.
- `Showreel.showreelUrl` when it points to uploaded media.
- `Video.thumbnail`.
- Exact Vercel Blob URLs embedded in `Video.description` and `Post.body`, which are the Markdown fields that can contain uploaded media.

Reference matching uses the normalized, exact Blob URL rather than a partial file-name substring. The first implementation does not attempt to detect transformed copies, manually rewritten URLs, or references outside these database fields; the confirmation UI must state this boundary.

If a file is referenced:

- The API rejects deletion.
- The UI disables or hides the destructive action when known.
- The UI displays the referencing content locations.

If a file is not referenced:

- The user receives a confirmation containing the exact file name and size.
- The server performs the reference check again immediately before deletion.
- The Blob is deleted only after that check succeeds.

Initial scope excludes folders, custom media tags, bulk deletion, and media migration.

## 13. Component and Responsibility Boundaries

The implementation should create focused units with stable interfaces rather than moving the existing monolithic Dashboard into another large component.

Expected boundaries include:

- `AdminShell`: sidebar/top bar, responsive navigation, View site, Sign out.
- `AdminPageHeader`: title, description, status, and page-level actions.
- `WorksList`: filtering and work actions.
- `WorkEditor`: form state, dirty tracking, save behavior.
- `WorkCardPreview`: presentation-only preview using form values.
- `WorkOrderEditor`: local ordering state and explicit commit.
- `NewsList`: filtering and News actions.
- `ShortPostEditor`: short-update form.
- `ArticleEditor`: Markdown editing and preview.
- `PageSettings`: Hero and Showreel cards.
- `MediaPicker`: reusable upload and selection workflow.
- `MediaLibrary`: inventory and safe deletion workflow.

Existing data access, schemas, API payloads, and components should be reused where they remain correct. Refactoring is justified only where it supports the approved workflows.

## 14. Data and Authorization

- Continue using Next.js App Router, Prisma, Neon PostgreSQL, NextAuth, and Vercel Blob. Use Server Components for protected route entry and initial list/settings reads; use Client Components for editors, upload progress, previews, filters, and local ordering state.
- Keep administrator route guards on every Dashboard route.
- Keep `requireAdmin()` on every write, upload, Blob listing, usage, and deletion API.
- UI visibility is not an authorization boundary.
- Do not expose Blob write credentials or database secrets to the client.
- Do not change the database schema unless implementation discovery identifies a requirement that cannot be met with existing fields; such a discovery requires a design amendment before proceeding.

## 15. Loading, Empty, Error, and Success States

Every module must explicitly cover:

- Initial loading.
- Empty content.
- Load failure and retry.
- In-progress mutation.
- Successful mutation.
- Failed mutation without loss of user input.

Specific requirements:

- The Work editor distinguishes file upload completion from content save completion.
- Ordering failure preserves the locally arranged order.
- News save failure preserves title, body, tag, type, and intended publication state.
- Media deletion failure leaves the item visible and reports the server reason.
- Destructive operations require confirmation proportional to their risk.
- Success feedback is explicit and does not rely solely on a page refresh.

## 16. Accessibility

- All form fields have programmatic labels.
- Field errors are associated with their fields.
- The desktop sidebar and mobile drawer expose correct navigation semantics.
- Menus and dialogs support keyboard operation, focus trapping where applicable, Escape, and focus restoration.
- Drag-and-drop ordering has equivalent up/down controls.
- Icon-only controls have accessible names.
- Save/upload progress and success use a polite live region; blocking save, upload, and deletion errors use an assertive alert.
- Focus states remain visible throughout the admin UI.

## 17. Visual Direction

- Preserve the site's black, white, and neutral-gray visual language.
- Optimize hierarchy and density for administration rather than reproducing the public site's cinematic presentation.
- Avoid decorative animation; use motion only for functional state transitions such as drawers, dialogs, and reorder feedback.
- Reuse existing UI primitives where they meet accessibility and behavior requirements.
- Do not introduce a second unrelated design system.

## 18. Implementation Phases

### Phase 1: Admin shell and Works

- Dedicated Admin shell and responsive navigation.
- Works list.
- Work editor with integrated media workflow and card preview.
- Explicit ordering mode.
- Compatibility redirects for old work-management URLs.

### Phase 2: News

- News list and filters.
- Short update editor.
- Markdown article editor and preview.

### Phase 3: Page settings and media

- Hero and Showreel settings cards.
- Shared media picker.
- Media library.
- Protected media deletion API and UI.

Each phase must be independently reviewable and deployable. A failed phase must be corrected before starting the next one.

## 19. Testing and Verification

Automated coverage should include:

- Admin route protection.
- Work create/update payload preservation.
- Dirty-state and failed-save state preservation where practical.
- Reorder commit, failure retention, and authorization.
- News type, draft, publish/unpublish, and payload behavior.
- Media reference detection across supported fields.
- Refusal to delete referenced media.
- Successful deletion of an unreferenced Blob.
- Permission enforcement on all new endpoints.

Verification commands must include:

- Repository tests.
- TypeScript checking.
- ESLint.
- `npx next build --webpack` rather than the repository `npm run build`, because the latter runs `prisma migrate deploy` and would violate the no-production-data-change boundary.
- `git diff --check`.

Browser verification must cover representative desktop and mobile sizes and the complete workflows for:

- Create/edit/save/return work.
- Upload failure and retry without form loss.
- Card preview updates.
- Reorder, cancel, save, failed save, and unsaved exit.
- Short update and article creation/editing.
- Hero and Showreel media replacement.
- Media filtering, reference display, blocked deletion, and safe unused-file deletion against non-production test data only.

## 20. Out of Scope

- Public-site redesign.
- Work draft/publish workflow.
- Analytics Dashboard.
- Multiple administrator roles or accounts.
- Collaboration, approvals, or revision history.
- Automatic saving.
- Media folders, custom media tags, bulk deletion, or storage-provider migration.
- Database migration or schema redesign.
- Changes to EdgeOne deployment, caching, or production regions.

## 21. Success Criteria

The redesign succeeds when:

- The administrator lands directly in Works and can locate primary actions immediately.
- Creating/editing a work keeps media selection, content entry, card preview, saving, public preview, and return navigation in one coherent workflow.
- Reordering is faster than repeated move actions and never affects the public order before explicit save.
- News content types are equally discoverable without forcing short updates through a full article editor.
- Hero and Showreel reuse one media workflow.
- Media deletion cannot remove known referenced files.
- Desktop space is used efficiently while occasional mobile administration remains viable.
- Existing public behavior, data, permissions, and production content remain intact.
