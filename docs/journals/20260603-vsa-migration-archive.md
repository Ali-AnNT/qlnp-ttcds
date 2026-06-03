# VSA Web Migration — Archive (12 Phases Complete)

**Date**: 2026-06-03 09:07
**Severity**: High
**Component**: packages/web (entire frontend src/)
**Status**: Resolved

## What Happened

Migrated `packages/web/src` from layered architecture (pages/api/components/store) to Vertical Slice Architecture across 12 sequential phases. Final structure: `app/` (entry, providers, router) + `features/` (10 self-contained domains) + `shared/` (api, hooks, lib, ui). Replaced single Zustand `useStore` with TanStack Query hooks per feature. No functional changes — pure structural refactor. All phases committed to `refactor/adjust-api-arch-follow-vsa-and-fastendpoint` branch.

## The Brutal Truth

The single Zustand `useStore` was a ticking bomb. Five domains (auth, departments, leave-types, leave-requests, approval-config) stuffed into one store, with 9 consumers scattered across pages and components. Every page reached into the same global blob — there was no architectural boundary, no colocation, no clear ownership. Migrating 9 consumers before deleting the store was the only way to avoid a multi-day broken state, and it worked. But the most painful part was always going to be the 77+ import path updates in Phase 1: `@/api/client` -> `@/shared/api/client`, `@/components/ui/*` -> `@/shared/ui/*`, plus 3 test files with relative `../api/client` paths that the alias find-replace pattern missed. Two different import styles, two separate search passes. The Config page (497 lines) and Violations page (439 lines) needed component extraction mid-migration — bigger than any single phase budget allowed, so they got carved into subcomponents in their respective phases. Phases 5, 10, and 11 each took 1h instead of 30m.

## Technical Details

**Final structure** (`packages/web/src/`):
- `app/` — App.tsx, providers.tsx, router.tsx, routes.ts, auth-loader.ts, NotFound.tsx
- `features/` — 10 domains: auth, layout, dashboard, leave-requests, approval, calendar, summary, reports, violations, config, shared-reference-data
- `shared/` — api/client, hooks (use-mobile, use-toast), lib (utils, date-utils), ui (49 shadcn files), index.ts barrel
- `test/` — 14 test files, all passing

**State migration:**
- Deleted `src/store/useStore.ts` entirely (5 domains, 9 consumers)
- AuthContext retained as global (auth is genuinely app-wide)
- All server state moved to TanStack Query hooks per feature (`useLeaveRequestsQuery`, `useLeaveTypesQuery`, etc.)
- UI state: useState/useReducer per component
- Zero Zustand feature stores remain

**Dead code removal:** 5 Supabase-era interfaces deleted from `lib/leave-data.ts` (Department, Employee, LeaveType, LeaveRequest, ApprovalConfig) — zero importers confirmed during Phase 1.

**Boundary enforcement:** ESLint `no-restricted-imports` rule added in Phase 12 to block future imports from old paths (`@/api/client`, `@/lib/utils`, `@/components/ui/*`).

**Validation log:** 40 claims checked, 39 verified, 1 minor (shadcn file count ~60 -> actual 49, non-blocking). 4 architecture decisions locked via user confirmation (delete dead interfaces, keep departments in layout, config owns leave-types, TanStack Query replaces Zustand).

**Plan size:** ~1996 LOC across plan.md + 12 phase files.

## Key Decisions

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Migration order | Bottom-up (shared first, features in dep order, cleanup last) | Top-down, big-bang | Rule: app compiles after every phase — no broken intermediate states |
| useStore replacement | TanStack Query per feature | Split into per-feature Zustand stores | Better caching, auto-invalidation, proper VSA end state |
| leave-types ownership | config owns CRUD; others import via config public API | Duplicate read-only copy in leave-requests | Single source of truth for LeaveTypeDto, no type drift |
| departments.api.ts | Stays in features/layout/ | Move to shared/api/ | Rule of Three — only sidebar consumes it; wait for 3+ features |
| Route preservation | Same URL paths, just internal restructure | Rename routes | Zero client/contract breakage, pure refactor |
| Dead interfaces | Delete during Phase 1 | Defer cleanup | Already touching the file, zero importers = safe delete |

## Impact on Codebase

- 12 commits on `refactor/adjust-api-arch-follow-vsa-and-fastendpoint` branch (one per phase)
- `app/` and `shared/` are now stable foundations — new features don't touch them
- Each feature is self-contained: `api/`, `components/`, `hooks/`, `pages/`, `helpers/`, `constants/`, `index.ts` (public API)
- ESLint boundaries prevent cross-feature deep imports — only `@/features/{name}` (public API) is allowed
- TanStack Query gives free cache + invalidation that the old Zustand store faked with manual `setState`
- `gitnexus detect_changes` will need to be re-run after merge to refresh symbol index

## Lessons Learned

1. **App-compiles-after-every-phase rule was non-negotiable.** Made 12 commits instead of 1, but every commit was reviewable and rollback-able. The "broken intermediate state" risk with Zustand replacement was real — sequencing 9 consumer migrations before deleting the store worked precisely because each phase left the app green.
2. **Find-replace by alias pattern misses relative imports.** `@/api/client` and `../api/client` are two different search passes. Phase 1 hit this with 3 test files; documented so future refactors check both.
3. **Rule of Three for shared extraction.** departments.api.ts stayed in layout because only 1 consumer existed. Resisted the urge to "future-proof" it into shared/ — YAGNI in action.
4. **User-confirmed decisions stay locked.** "Config owns leave-types" was confirmed in validation log Q3. Phases 5-8 all imported via config public API per that decision — no scope drift across 4 phases.
5. **Large page extraction is its own phase-sized task.** ConfigPage (497) and ViolationsPage (439) each consumed their full phase budget once component extraction was added. Don't underestimate component decomposition time.
6. **Barrel exports (`index.ts`) are worth the maintenance cost** for shared/ — Phase 1 suffered 77 import updates specifically because the old code had no barrels. New structure prevents this for future moves.

## Next Steps

- Merge `refactor/adjust-api-arch-follow-vsa-and-fastendpoint` into `dev` (per git branch flow rule: branch -> PR -> dev -> PR -> main)
- Re-run `npx gitnexus analyze --embeddings` post-merge to refresh stale index (1354 symbols, 35 execution flows will have shifted)
- Monitor for any ESLint `no-restricted-imports` violations creeping in from new code
- Consider whether the LeaveStatus type still belongs in `features/shared-reference-data/constants/app-roles.ts` (medium-priority debt noted in Phase 1 journal)
- The follow-up approvable-requests API plan (commit ea3a3fd) assumes VSA frontend structure is in place — unblocked now
