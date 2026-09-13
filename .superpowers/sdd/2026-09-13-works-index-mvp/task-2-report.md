# Task 2 Report: Tested Works Index View-Model Helpers

## Implementation

- Added `lib/works-index.ts` with `selectFeaturedWorks`, `groupWorksByYear`, `normalizeShowreelType`, and `WorkYearGroup`.
- Added typed fixture tests in `tests/works-index.test.ts`.
- Featured selection preserves source order without a cap.
- Year grouping sorts year groups newest-first, preserves work order within each year, and appends undated work under `Other`.
- Showreel values normalize to `upload` only for the exact `upload` value; all other values normalize to `url`.

## RED/GREEN evidence

RED command:

```powershell
npm test -- tests/works-index.test.ts
```

Result: failed as expected because `../lib/works-index` did not exist (`MODULE_NOT_FOUND`); the two pre-existing tests passed.

GREEN verification:

```powershell
npm test -- tests/works-index.test.ts
npx tsc --noEmit
git diff --check
```

Result: all 5 tests passed; TypeScript verification passed; diff check passed.

## Files

- `lib/works-index.ts`
- `tests/works-index.test.ts`

## Commit

`9cda593 test: define works index grouping`

## Self-review

Reviewed the diff after implementation. The helpers are pure, do not alter source arrays, do not sort works within a year, do not cap featured works, and stay within the requested files and scope. No concerns found.
