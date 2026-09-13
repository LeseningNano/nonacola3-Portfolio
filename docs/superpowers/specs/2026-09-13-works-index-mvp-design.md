# Works Index MVP Design

## Objective

Create a dedicated `/works` index page for Motion Designer job applications. The page should help an HR reviewer or production lead understand the creator's positioning, view the showreel, assess representative work, and scan the complete archive within a short visit.

The existing homepage Works section and existing `/works/[id]` case studies remain unchanged.

## Audience

- HR reviewers who may spend only a few dozen seconds on the page
- Motion design and video production leads evaluating craft and project fit
- Studios hiring for PV, motion graphics, compositing, and Blender-oriented work

## MVP Scope

The MVP includes:

1. A dedicated `/works` route
2. A concise professional positioning header
3. A prominent showreel module
4. A visually distinct Selected Works section
5. A simpler All Works archive grouped by year
6. A compact contact call to action
7. Links from both work sections to the existing case studies

The MVP does not redesign the homepage Works section, case-study pages, global navigation style, database architecture beyond the minimum metadata needed by the new cards, or video hosting.

## Information Architecture

The page order is fixed:

1. Professional positioning
2. Showreel
3. Selected Works
4. All Works
5. Contact

This order reflects the hiring funnel: identify the candidate, form a first impression, verify capability, inspect breadth, then contact.

## Header and Positioning

The header uses a direct job-oriented statement rather than a generic portfolio introduction.

Primary positioning:

> Motion Designer creating PV, game promotional visuals and cinematic motion graphics.

Supporting statement:

> Focused on rhythm-driven editing, compositing and 3D visual storytelling with After Effects and Blender.

A compact information strip follows the statement:

- Location: China
- Focus: PV Production, Motion Graphics, Compositing, Blender

This strip is not a second About section. It exists only to give hiring reviewers essential context without requiring another page visit.

## Showreel

The showreel is the first major visual object and uses a large 16:9 or slightly cinematic player area.

Displayed information:

- `SHOWREEL 2026`
- `Motion Design / PV / Compositing / 3D`
- Duration, such as `01:03`
- Supporting copy: `A collection of motion design, PV and visual experiments.`

The module renders a large poster-style player surface with its metadata attached below. Activating the play control replaces the poster in place with the existing configured upload or embed source. The video itself is not loaded before activation.

## Selected Works

Selected Works provides the strongest evidence of capability. It contains a small curated set, expected to be three projects for the MVP.

Desktop presentation:

- One dominant project card
- Two supporting project cards
- Deliberately asymmetric editorial layout

Mobile presentation:

- Single-column cards
- All essential metadata remains visible without hover

Each selected card displays:

- Thumbnail
- Project title
- Project type or category
- Role
- Tools
- `View Case Study →` action

Example:

```text
Numb Numb PV
Virtual Singer Cover PV

Role
Motion Design / Compositing

Tools
After Effects · Blender

View Case Study →
```

Selection should use the existing `featured` state so administrators retain control over which projects appear. The layout should remain usable if fewer or more than three projects are featured, but three is the intended editorial set.

## Work Metadata

The existing video record does not provide structured Role or Tools values. The MVP therefore adds two optional pieces of metadata to a work:

- `role`: short display text, for example `Motion Design / Compositing`
- `tools`: short display text, for example `After Effects · Blender`

Both fields are optional so existing records continue to render. Empty fields are omitted rather than replaced with placeholder text. The administration form should allow these values to be maintained alongside existing work metadata.

No other new work fields are included in the MVP.

## All Works

All Works is the complete archive, grouped by the year derived from the existing work date.

The archive intentionally uses lower visual and information density than Selected Works:

- Year heading
- Compact thumbnail
- Title
- Category
- Link to the existing case study

Selected projects may appear again because All Works is complete, but the repetition should not feel like a duplicated section. The distinction comes from presentation:

- Selected Works: large editorial cards, description, Role, Tools, explicit case-study action
- All Works: compact regular grid with minimal metadata

Years appear in descending order. Projects without a date appear in an `Other` group at the end rather than disappearing.

No category filter, search, sorting control, pagination, or infinite scrolling is included in the MVP.

## Contact

The page ends with a compact hiring-oriented call to action:

- Availability label
- `Let's work together.` heading
- Contact link using the site's existing contact destination

This does not duplicate the full About content.

## Navigation and Case Studies

- Global navigation receives a route to `/works` without changing its visual style.
- The existing homepage Works anchor remains unchanged.
- Both Selected Works and All Works link to `/works/[id]`.
- Existing intent-prefetch behavior should be reused to reduce case-study wait time without eager-prefetching every work.
- Existing covered page transition and work thumbnail transition remain in place.
- Case-study content, related-work logic, and cache policy are unchanged.

## Responsive Behavior

### Desktop

- Maximum content width: 1200px
- Strong typographic positioning header
- Wide showreel module
- Asymmetric Selected Works composition
- Three-column compact All Works grid where space permits

### Mobile

- Single-column flow
- Reduced heading scale without changing hierarchy
- Showreel retains a touch-friendly 16:9 presentation
- Selected cards become single-column and expose Role and Tools by default
- All Works uses one or two columns depending on available width
- No hover-only information or autoplay previews

## Motion and Interaction

The MVP keeps motion restrained:

- Static thumbnails by default
- Reuse the existing subtle image scale and overlay treatment on desktop hover
- Clear focus states for keyboard navigation
- No autoplaying card videos
- No moving marquee on the new index page
- Respect `prefers-reduced-motion`

Motion previews are explicitly deferred beyond the MVP.

## Data Flow and Rendering

- The `/works` route reads the same public work source as the homepage and case studies.
- Work data is serialized using the shared work type, extended only with optional Role and Tools fields.
- Featured works are selected from the complete collection.
- All works are grouped by serialized year before rendering.
- The page is statically rendered with a 300-second revalidation interval, matching public case studies, so ordinary visits do not require a fresh database query.

## Empty and Edge States

- No showreel: omit the media module and allow Selected Works to follow the header.
- No featured works: omit Selected Works rather than showing an empty placeholder.
- No works: show one concise unavailable message and retain the contact section.
- Missing thumbnail: reuse the existing neutral fallback treatment.
- Missing Role or Tools: omit that metadata row.
- Invalid work link: existing case-study not-found behavior remains authoritative.

## Accessibility

- Use semantic headings in page order.
- The showreel control requires an accessible name.
- Each project image uses the project title as alternative text unless it is purely decorative within an already labelled link.
- Cards remain reachable and understandable by keyboard.
- Role and Tools must be text, not information encoded only by icons.
- Text and interactive controls maintain contrast against the existing dark background.

## Performance Constraints

- Do not load preview videos for project cards.
- Give loading priority only to the showreel poster. Instantiate the actual showreel video or iframe after user activation.
- Use accurate responsive image `sizes` for large Selected cards and compact All Works cards.
- Do not eager-prefetch every case study.
- Avoid duplicated work-card DOM such as the homepage marquee repetition.
- Keep the page statically cacheable and avoid a mandatory database connection on each visit.

## Validation

The implementation should be verified with:

- TypeScript checking
- Production build
- Desktop browser review at a representative wide viewport
- Mobile browser review around 390px width
- Keyboard navigation through showreel, selected projects, archive projects, and contact
- Confirmation that the homepage Works section is unchanged
- Confirmation that Role and Tools gracefully disappear when absent
- Confirmation that all work links reach the existing case studies
- Confirmation that the initial `/works` load does not request every case-study route

## Success Criteria

- A hiring reviewer can identify the candidate's discipline and tools without leaving `/works`.
- The showreel is unmistakably the primary first-view action.
- Selected Works communicate contribution, not merely project titles.
- All Works provide complete chronological breadth without visually competing with Selected Works.
- The original homepage Works experience remains unchanged.
- The new page stays fast on mobile and does not introduce card-level video loading.
