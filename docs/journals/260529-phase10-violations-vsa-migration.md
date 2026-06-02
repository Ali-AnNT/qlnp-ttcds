# Phase 10: Violations VSA Migration

**Date**: 2026-05-29
**Severity**: Medium
**Component**: packages/web -- features/violations
**Status**: Resolved

## What Happened

Completed Phase 10 of the VSA migration for `packages/web`. Migrated the Violations feature from the legacy `src/pages/ViolationsPage.tsx` into a modular vertical slice at `src/features/violations/`. This was a major structural refactor that decomposed a monolithic 439-line file into a thin container shell supported by 7 specialized sub-components and a custom logic hook (`use-violations.ts`).

The implementation fully removed dependence on the global Zustand `useStore` for violations data, transitioning to TanStack Query for cache management and optimistic updates. 

## The Brutal Truth

Refactoring a 439-line page is a slog. The original code had everything—filtering logic, bulk action state, modal management, and table rendering—all fighting for space in one massive component. It was "readable" only to the person who wrote it. 

The hardest part wasn't the API migration, but the **extraction of the filtering and selection state**. We had to decide if we should keep the complex filter state in the hook or move it to a dedicated filter store. We chose to keep it local to the `useViolations` hook to maintain the "Feature Slice" encapsulation, but it pushed the hook's complexity higher than I'd like.

We also hit a snag with **bulk actions**. The old Zustand store made bulk selection "easy" because it was global. Moving it to local component state meant we had to lift state or use a context provider. We chose a simple lifting-state pattern into the `useViolations` hook, which now manages the `selectedIds` set. It's cleaner for testing but required more prop-drilling than we originally planned.

## Technical Details

**Decomposition Results:**
- `ViolationsPage.tsx` (Shell) -- Reduced to ~40 lines of layout and orchestration.
- `use-violations.ts` (Hook) -- 120 lines of TanStack Query hooks and selection logic.
- `ViolationFilter.tsx` -- Isolated filtering UI and state.
- `ViolationTable.tsx` -- Pure rendering of violation rows.
- `ViolationStatusBadge.tsx` -- Shared UI primitive.
- `ViolationBulkActions.tsx` -- Orchestrates multi-record operations.
- `ViolationResolveModal.tsx` -- Self-contained modal logic.
- `ViolationDetailDrawer.tsx` -- Side-panel for deep inspection.
- `ViolationStatsSummary.tsx` -- Top-level metric cards.

**State Transition:**
- **Before:** `const { violations, fetchViolations } = useStore();` (Imperative, global, stale-prone).
- **After:** `const { violations, isLoading } = useViolations();` (Declarative, cached, auto-refetching).

**Cross-Feature Imports:**
- Successfully imported `useDepartments` from `@/features/departments` to populate filter dropdowns, validating the feature boundary pattern established in Phase 5.

## What We Tried

1. **Context Provider for Selection**: Considered creating a `ViolationSelectionProvider` to avoid prop-drilling `selectedIds`. Decided against it for now to keep the implementation simple. If bulk actions get more complex, we'll refactor to context.
2. **TanStack Table Integration**: Briefly considered migrating to `@tanstack/react-table` during this phase. Scoped it out because the priority was architecture migration, not UI library replacement. We kept the existing shadcn/ui table components to avoid regression risk.

## Root Cause Analysis

The 439-line file was a classic case of "Component Growth by Accretion." Every new feature (filters, then bulk actions, then drawers) was just added to the same file because it was faster than building a proper feature slice. This migration has proven that the VSA boundary is the only thing preventing this kind of entropy.

## Lessons Learned

1. **Thin shells make for better debugging.** When the page is just a shell, you can instantly see if a bug is in the data hook, the filter component, or the table rendering.
2. **Zustand to TanStack Query migration is a "delete-heavy" operation.** We deleted more lines of store-management code than we added in hooks. The declarative nature of TanStack Query eliminates the need for manual loading/error states in the store.
3. **Encapsulation hurts before it helps.** Designing the selection logic to be self-contained within the violations feature felt like "extra work" compared to just using a global store, but the resulting component is now actually testable in isolation.

## Next Steps

- Phase 11: Configuration migration (Final API cleanup)
- Phase 12: Final cleanup and total removal of `useStore.ts`
- No unresolved questions for the violations feature.
