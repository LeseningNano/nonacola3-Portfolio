# Works Page Polish Design

Date: 2026-09-14
Status: Approved direction, pending implementation plan

## Objective

Refine the existing `/works` MVP into a stronger Motion Designer job-seeking portfolio page for recruiters and production leads. Preserve the current black-and-white visual language, existing content model, case-study routes, and infrastructure.

This is a focused refinement of `/works`. It does not replace or redesign the Works section on the homepage.

## Audience and Success Criteria

The primary audience is HR staff and production-company decision makers. Within the first few seconds, they should understand:

- the candidate is a Motion Designer;
- the work focuses on PV, game promotional visuals, compositing, and 3D;
- After Effects and Blender are core tools;
- the Showreel is the fastest overview;
- Selected Works contain deeper evidence of capability.

The page succeeds when visitors can scan the positioning, watch the Showreel, understand the candidate's role in selected projects, browse the complete work history, and reach a case study or contact link without ambiguity.

## Page Structure

The page keeps five sections in this order:

1. Positioning
2. Showreel
3. Selected Works
4. All Works
5. Contact

No additional feature, long-form About section, skill meter, filter, or contact form is introduced.

## Positioning and First-Screen Content

The headline remains exactly:

> Motion Designer creating PV, game promotional visuals and cinematic motion graphics.

The headline is the primary visual element. These phrases are highlighted in white:

- Motion Designer
- PV
- game promotional visuals
- cinematic motion graphics

All connecting words use a lower-contrast gray. The wording and order are not changed.

Supporting content stays concise and recruiter-oriented:

- location: China;
- availability or work-direction statement;
- focus: PV, Compositing, and 3D;
- tools: After Effects and Blender.

On desktop, the first-screen supporting information uses a compact two-column composition so the Showreel appears sooner. On mobile, it becomes a single readable column.

## Entrance Animation

The entrance sequence runs once each time `/works` is entered. It does not replay because of hover, focus, scrolling, or component state changes while the visitor remains on the page.

Sequence:

1. The unchanged headline appears word by word using opacity only.
2. Highlighted keyword phrases use white; all other words use gray.
3. The complete word sequence lasts approximately 1.2 to 1.6 seconds.
4. When the final word has appeared, all remaining first-screen elements fade in together.
5. The supporting-content fade lasts approximately 500 to 700 milliseconds.

There is no translation, bounce, scale, blur, parallax, stagger among supporting elements, or scroll-triggered entrance animation. Showreel, Selected Works, All Works, and Contact remain immediately present in the document flow.

When `prefers-reduced-motion: reduce` is active, the entire first screen renders immediately with no staged reveal.

## Showreel

The Showreel remains the first major media element and retains the large 16:9 player presentation.

Its supporting information includes:

- `SHOWREEL 2026`;
- `Motion Design / PV / Compositing / 3D`;
- a short description;
- duration.

The poster loads first. The external player or full video is loaded only after the visitor activates Play. The page does not autoplay the Showreel and does not introduce a separate Showreel detail page.

## Selected Works

Selected Works uses alternating case-study rows on desktop. Each row contains a large 16:9 image and a dedicated information column. Odd and even rows alternate image and information placement to establish editorial rhythm without changing the image ratio.

Each selected project displays:

- title;
- project type or category;
- concise summary;
- Role;
- Tools;
- `View Case Study` link.

Selected Works should normally contain three to four projects. It is the page's primary evidence section, so information must remain readable without hover.

Desktop interactions are deliberately restrained:

- slight image scale;
- slight overlay change;
- small arrow movement;
- visible keyboard focus equivalent.

No autoplaying motion preview is introduced in this refinement.

## Mobile Selected Works

Desktop alternation collapses to a consistent media-first order:

1. image;
2. title and project type;
3. Role and Tools;
4. summary;
5. View Case Study link.

Mobile never reverses the content order between projects. Core information is not placed inside an image overlay and does not depend on hover. Interactive rows and links retain a comfortable touch target.

## All Works

All Works changes from a thumbnail grid to a year-grouped filmography index. This creates a clear distinction from the media-rich Selected Works section and avoids making visitors feel that they are viewing the same cards twice.

Each year group contains compact, fully clickable rows showing:

- sequence number;
- project title;
- project type or category;
- directional arrow.

Selected projects may still appear in All Works because the archive represents the complete history. Their compact list treatment makes the repeated entry intentional rather than visually repetitive.

All Works does not request thumbnails. On desktop, hover and focus may increase title contrast, move the arrow slightly, and add a subtle row-background change. Mobile receives the same information without hover-dependent behavior.

## Contact

The Contact section stays minimal:

- availability label;
- short invitation;
- direct email link.

No form, social aggregation, calendar integration, or additional workflow is added.

## Responsive Layout

The existing maximum content width of approximately 1200 pixels remains. The implementation reuses the project's existing Tailwind breakpoints and does not introduce a parallel breakpoint system.

Desktop:

- compact two-column positioning area;
- large Showreel immediately after positioning;
- alternating Selected Works rows;
- full-width filmography index.

Mobile:

- approximately 20-pixel horizontal gutter;
- single-column positioning content;
- Showreel before project evidence;
- media-first Selected Works;
- compact filmography rows with title and category allowed to wrap safely.

## Accessibility

- Project entries remain semantic links rather than clickable generic containers.
- Hover and keyboard focus receive equivalent visual feedback.
- Work images use the project title as alternative text.
- The Showreel play control retains an explicit accessible name.
- Year groups use semantic headings and the archive uses list semantics.
- No essential information is communicated only through animation, imagery, or color.
- Reduced-motion users receive all content immediately.

## Performance Boundaries

- Showreel continues to load its poster before the player or video.
- Only the three to four Selected Works images are used in the evidence section.
- All Works no longer loads thumbnails, reducing image requests.
- Existing same-origin thumbnail proxy behavior remains unchanged for Selected Works.
- Existing intent-based detail-route prefetch behavior remains unchanged.
- The entrance animation uses opacity and does not delay document rendering or navigation.

This refinement does not modify:

- the database schema;
- public data structures;
- case-study routes or rendering;
- API routes;
- cache TTLs or invalidation;
- EdgeOne configuration;
- Hero behavior;
- global page-transition timing.

## Implementation Boundaries

Expected implementation scope:

- `app/works/page.tsx`
- `components/works-index/showreel-feature.tsx`
- `components/works-index/selected-work-card.tsx`
- `components/works-index/work-archive.tsx`
- one small client component for the first-screen entrance sequence if required
- focused tests for pure presentation logic and rendered behavior

The implementation must not modify the homepage Works layout, production data, admin workflows, database migrations, or infrastructure configuration.

## Validation

The implementation is complete only after:

1. Focused tests pass.
2. The full test suite passes.
3. TypeScript passes.
4. The Next.js production build passes using `npx next build --webpack` without running database migrations.
5. Desktop browser verification confirms the selected recruiter-first composition, alternating case rows, and filmography index.
6. Mobile browser verification confirms media-first project order and usable archive rows.
7. The entrance animation plays once per `/works` entry, uses the approved emphasis, and does not replay during scrolling or interaction.
8. Reduced-motion verification confirms immediate content display.
9. The homepage Works section and existing page-transition behavior remain unchanged.
