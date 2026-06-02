# Phase 11: Config Feature VSA Migration

**Date**: 2026-05-29 10:15
**Severity**: Medium
**Component**: packages/web (Frontend)
**Status**: Resolved

## What Happened

Successfully migrated the Config feature from a monolithic `ConfigPage.tsx` and scattered API modules into a self-contained Vertical Slice Architecture (VSA) structure in `src/features/config/`.

## The Brutal Truth

`ConfigPage.tsx` was a beast at nearly 500 lines, juggling three distinct domains: general system settings, leave types CRUD, and N-level approval flow configuration. Migrating it required careful extraction of 6 sub-components to stay under the 200-line rule. The complexity of approval flow configuration (dynamic levels 1-5 with role selection) was particularly tricky to isolate into its own dialog and manager component without breaking the state synchronization.

## Technical Details

- **Feature Directory**: `packages/web/src/features/config/`
- **Sub-components Extracted**:
  - `general-settings.tsx`
  - `default-days-settings.tsx`
  - `leave-type-manager.tsx`
  - `approval-flow-manager.tsx`
  - `leave-type-dialog.tsx`
  - `approval-dialog.tsx`
- **TanStack Query Hooks**:
  - `use-leave-types.ts`
  - `use-approval-config.ts`
  - `use-system-configs.ts`
- **API Consolidation**: Moved `config.api.ts`, `system-configs.api.ts`, and `leave-types.api.ts` into `features/config/api/`.
- **Zustand Elimination**: Completely removed `ConfigPage` dependency on the global Zustand store, switching to TanStack Query for all server state.

## What We Tried

Initially, we considered keeping `leave-types.api.ts` in a shared location, but since `Config` is the primary owner of its CRUD operations, we moved it into the feature. To satisfy other features (like `leave-requests`) that need leave type data, we re-export `LeaveTypeDto` and the read-only hook from the `config` public API. This follows the "Sovereign Owner" pattern while providing controlled access to shared reference data.

## Root Cause Analysis

N/A (Structural refactor)

## Lessons Learned

Decomposing a 500-line file is easier when you first identify the "Tab boundaries". Each tab in `ConfigPage` served as a natural slice for a sub-feature. Extracting the Dialogs (`leave-type-dialog.tsx`, `approval-dialog.tsx`) early reduced the main component's state complexity significantly.

## Next Steps

1. **Phase 12: Cleanup**: Delete `useStore.ts` as all consumers have now been migrated to TanStack Query.
2. **ESLint Boundaries**: Enforce strict VSA boundaries to prevent features from deep-importing each other's internals.
