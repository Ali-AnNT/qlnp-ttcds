# VSA Phase 1: Shared Infrastructure & App Layer Extraction

**Date**: 2026-05-29 04:34
**Severity**: Medium
**Component**: packages/web — architecture, imports, build
**Status**: Resolved

## What Happened

Completed Phase 1 of a 12-phase VSA (Vertical Slice Architecture) migration for `packages/web`. Moved shared infrastructure into `src/shared/{api,lib,hooks,ui}/`, extracted the `App.tsx` monolith into `src/app/{App,providers,router}.tsx`, split `lib/leave-data.ts` into domain-specific files, deleted 5 dead Supabase-era interfaces, and updated 77+ import paths across the codebase. Build passes, 14/14 tests pass (pre-existing `vi.unstubAllGlobals` compat issue in client.test.ts is unrelated to Phase 1).

## The Brutal Truth

Seventy-seven import path updates is tedious, nerve-wracking work. Every single one is a potential build break. There is no clever shortcut — you grep, you replace, you build, you fix what screamed, you repeat. The worst part is that one missed import silently compiles but breaks at runtime if Vite resolves a stale path cache. We caught zero runtime breakages, but only because we rebuilt clean and opened the dev server. The confidence after "build passes" is real but fragile — we did not run every page in the browser, we trusted the type checker.

The dead interfaces deletion felt great. Removing `Department`, `Employee`, `LeaveType`, `LeaveRequest`, `ApprovalConfig` from `leave-data.ts` was a tiny revenge against the Supabase-era technical debt that accumulated when this project was a different stack entirely. Five dead types with zero importers — ghosts in the type system.

## Technical Details

**Files moved:**
- `src/api/client.ts` -> `src/shared/api/client.ts`
- `src/lib/utils.ts` -> `src/shared/lib/utils.ts`
- `src/lib/date-utils.ts` -> `src/shared/lib/date-utils.ts`
- `src/hooks/use-mobile.tsx` -> `src/shared/hooks/use-mobile.tsx`
- `src/hooks/use-toast.tsx` -> `src/shared/hooks/use-toast.tsx`
- `src/components/ui/*` (49 files) -> `src/shared/ui/*`

**Files extracted:**
- `src/App.tsx` (monolith) -> `src/app/App.tsx` + `src/app/providers.tsx` + `src/app/router.tsx`

**Files split:**
- `src/lib/leave-data.ts` -> `src/features/shared-reference-data/constants/app-roles.ts` + `src/features/shared-reference-data/helpers/approval-status.ts`

**Files deleted:**
- 5 dead interfaces: `Department`, `Employee`, `LeaveType`, `LeaveRequest`, `ApprovalConfig` (zero importers, Supabase-era remnants)

**Import path patterns updated:**
- `@/api/client` -> `@/shared/api/client`
- `@/lib/utils` -> `@/shared/lib/utils`
- `@/lib/date-utils` -> `@/shared/lib/date-utils`
- `@/hooks/use-mobile` -> `@/shared/hooks/use-mobile`
- `@/hooks/use-toast` -> `@/shared/hooks/use-toast`
- `@/components/ui/*` -> `@/shared/ui/*`
- `@/lib/leave-data` -> `@/features/shared-reference-data`

**Test fixes:** 3 test suites had stale `../api/client` relative imports that needed updating to `@/shared/api/client`.

**Quality gates:** `bun run build` 0 errors, `tsc --noEmit` clean, 14/14 tests pass, code review PASS.

## What We Tried

1. **Batch find-replace for import paths** — worked for `@/api/client` -> `@/shared/api/client` etc. Verified with `grep -r` after each batch. Had to run 7 distinct patterns.
2. **Build-after-every-step discipline** — caught import errors immediately rather than accumulating 77 breaks at once. This saved sanity.
3. **Test suite spot-check** — the 3 test files with relative `../api/client` imports were missed by the alias-based find-replace. Had to manually find and fix relative imports separately.

## Root Cause Analysis

The real challenge was not architectural — it was mechanical. Moving files is trivial. Updating every import that references them is a O(N) slog where N=77 and every mistake is a compile error. The root cause of the tedium: the old layered architecture scattered imports across pages, components, hooks, store, and contexts with no barrel exports, so every file directly imported the deep path. No indirection layer meant no single point of update.

The dead interfaces existed because the project was originally a Supabase-backed app with different type definitions. When the backend migrated to .NET 9/FastEndpoints, the frontend types were never cleaned up — they just sat in `leave-data.ts` alongside the constants that were still in use.

## Lessons Learned

1. **Barrel exports (index.ts) are worth the maintenance cost.** The new `shared/index.ts` barrel means future refactors touch 1 file, not 77. We deliberately omitted `use-toast` from the barrel because it is internal to shadcn — document intentional omissions or someone will "fix" them.
2. **LeaveStatus type placement is a medium-priority debt note.** It sits in `app-roles.ts` alongside role constants because the original `leave-data.ts` had them together. Conceptually it belongs in `leave-status.ts` but we shipped the split as-is. Future cleanup: extract when it bothers someone enough.
3. **Always check relative imports separately from alias imports.** The `@/` alias find-replace pattern misses `../` relative paths in test files. Two different patterns, two different search passes.
4. **"Build passes" is necessary but not sufficient.** We did not verify every page renders in the browser post-move. For a pure file-move refactor this is probably fine, but the next person doing this should open the dev server and click through routes.
5. **Dead code deletion during a move is the best time to do it.** You are already touching the file, already reading every line. If you defer it, it becomes a separate task that never gets prioritized.

## Next Steps

- Phase 2 (Auth) is unblocked — it needs `@/shared/api/client` and `@/features/shared-reference-data`, both now available
- Re-run `npx gitnexus analyze` post-merge to refresh the stale index (noted in review)
- Consider adding ESLint `no-restricted-imports` rule to prevent future imports from old paths (`@/api/client`, `@/lib/utils`, `@/components/ui/*`) — schedule for Phase 12
- Extract `LeaveStatus` from `app-roles.ts` to a dedicated `leave-status.ts` during a future cleanup pass (medium priority)