# Phase 3 Layout VSA Migration

**Date**: 2026-05-29 05:49
**Severity**: Medium
**Component**: features/layout
**Status**: Resolved

## What Happened

Migrated layout (AppLayout, AppSidebar, AppHeader, departments API) into `src/features/layout/`. Created 5 files, updated 3 consumers (router.tsx, useStore.ts, useStore.test.ts), deleted NavLink.tsx (dead code — 0 consumers, AppSidebar uses react-router-dom NavLink directly), deleted 5 old files from `src/pages/`, `src/components/`, `src/api/`. Build passes, 14/14 tests green, 0 stale references, code review: 0 critical, 0 blocking.

## The Brutal Truth

This was the smoothest phase so far — which is suspicious. Only 3 consumers to update instead of 11 (auth) or 77+ (shared infra). The low consumer count made the import update almost trivial, but it also means layout is not deeply integrated into the rest of the app, which is exactly what VSA wants. The uncomfortable bit is `departments.api.ts` sitting in the layout feature. Department data is domain data; it has no business living under "layout." But currently only the sidebar consumes it. We applied the Rule of Three — move it to shared when a third feature needs it. Feels like deferring a decision, because it is. But premature extraction to shared is the exact pattern that created the layered mess we are migrating away from.

## Technical Details

**Files created (5):**
- `features/layout/components/app-layout.tsx` — from `src/pages/AppLayout.tsx`
- `features/layout/components/app-sidebar.tsx` — from `src/components/AppSidebar.tsx`
- `features/layout/components/app-header.tsx` — from `src/components/AppHeader.tsx`
- `features/layout/api/departments.api.ts` — from `src/api/departments.api.ts`
- `features/layout/index.ts` — barrel export

**Files deleted (6):**
- `src/pages/AppLayout.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/AppHeader.tsx`
- `src/components/NavLink.tsx` (dead — 0 importers)
- `src/api/departments.api.ts`

**Consumer updates (3):**
- `app/router.tsx` — `import { AppLayout } from '@/features/layout'`
- `src/store/useStore.ts` — departments API import path
- `src/store/useStore.test.ts` — departments API import path

**Key architectural change:** AppLayout converted from `export default` to named `export const AppLayout` for VSA consistency. Barrel re-exports named exports cleanly; default exports require `export { default as X }` which is fragile and non-obvious (see Phase 2 lesson).

**Quality gates:** `bun run build` 0 errors, 0 stale import references via grep, code review PASS.

## What We Tried

1. **Checked NavLink.tsx for consumers** before deleting. `grep -r "NavLink" src/` returned only `react-router-dom` imports inside AppSidebar. The custom NavLink component had zero importers — dead code from an earlier refactor. Deleted without hesitation.
2. **Considered moving departmentsApi to shared/** — rejected. Only layout consumes it currently. Rule of Three: defer until a third feature needs department data, then extract to shared or a dedicated `features/departments` slice.
3. **Considered keeping AppLayout as default export** — rejected. Named exports work better with barrel files and prevent the `export { default as X }` pattern that burned us in Phase 2 auth.

## Root Cause Analysis

Layout was split across three directories (`pages/`, `components/`, `api/`) because the original architecture was technically layered by file type. This is the same root cause as Phases 1 and 2 — the layered pattern scatters related code across directories based on "what kind of file is it" rather than "what feature does it serve."

The dead NavLink.tsx existed because at some point AppSidebar was refactored to use react-router-dom's built-in NavLink directly, but the old wrapper component was never cleaned up. Classic dead code accumulation — nobody touches imports they are not actively debugging.

## Lessons Learned

1. **Named exports > default exports for VSA barrel files.** We made this call in Phase 2 after the `export { default }` confusion. Phase 3 confirmed it — named exports are explicit, searchable, and play cleanly with `index.ts` barrels. Make this a project convention.
2. **Dead code is easiest to find during migration.** We are already grepping for every import of every file we move. If a file has zero importers, delete it immediately. Do not defer to "later cleanup" — later never comes.
3. **Domain data in layout feature is a smell, but deferring extraction is correct.** The alternative — creating `features/departments/` for a single consumer — is premature abstraction. The Rule of Three is the right heuristic. Document the smell so the next developer does not assume it is intentional.
4. **Low consumer count phases feel easy.** That is not luck — it is a sign the feature boundary is well-defined. Layout has a clear contract: the router imports `AppLayout` and the store imports `departmentsApi`. Two entry points. That is a good feature slice.

## Next Steps

- **Phase 4 (Dashboard)** is unblocked — it imports from `@/features/auth` and `@/features/layout`, both now in place
- **Track departmentsApi ownership** — add a TODO or ADR note: when a third feature needs department data, extract `departments.api.ts` to `features/departments/` or `shared/api/`
- **Consider ESLint `no-restricted-imports`** for old paths (`@/api/departments`, `@/components/AppSidebar`, etc.) — scheduled for Phase 12
- **Verify in browser** — build passes but no manual route-clicking was done; someone should open the dev server and confirm sidebar navigation + header rendering work