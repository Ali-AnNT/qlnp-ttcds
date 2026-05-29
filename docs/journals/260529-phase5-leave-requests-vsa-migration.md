# Phase 5: Leave Requests VSA Migration

**Date**: 2026-05-29
**Severity**: Medium
**Component**: packages/web -- features/leave-requests
**Status**: Resolved

## What Happened

Completed Phase 5 of the 12-phase VSA migration for `packages/web`. Migrated the leave-requests feature from layered architecture to a self-contained VSA slice at `src/features/leave-requests/`. Migrated LeaveNewPage and LeaveMyPage from Zustand store usage to TanStack Query hooks. Built the first cross-feature import pattern (leave-requests imports leave-types from config feature). Build passes with zero errors.

Also created the `features/config/index.ts` barrel export and moved `leave-types.api.ts` and `config.api.ts` into `features/config/api/` to establish the config feature boundary.

## The Brutal Truth

This was the hardest phase so far -- not because of complexity, but because of the **validation session decision** that left us in a limbo state. The code review flagged a legitimate bug: mutations were silently succeeding on API errors. The fix (adding `unwrap()`) was small, but catching it after the build passed is exactly the kind of thing that makes you question whether the migration is actually safe.

The cross-feature import between leave-requests and config also forced a structural decision I'd been dodging. Config's API surface was scattered across different API modules. We had to pick: extract config API now (scope creep into Phase 11) or create a clean import boundary. We chose the boundary, moved two API files into `features/config/api/`, and moved on. It's not elegant, but it's honest about the current state.

Two old API files (`src/api/leave-requests.api.ts`, `leave-balances.api.ts`) still exist because ApprovalPage and other pages still consume them through useStore. That means **we're shipping with two parallel data paths for leave requests**. One goes through TanStack Query, the other through Zustand. They share the same HTTP calls but have separate cache layers. If the old pages update data through useStore, the new VSA pages won't know until a manual refetch. This is a risk we've accepted because the remaining phases are ordered specifically to minimize this window.

## Technical Details

**Files created:**
- `features/leave-requests/api/types.ts` -- LeaveRequestDto, CreateLeaveRequestDto, LeaveBalanceDto (shared DTOs)
- `features/leave-requests/api/leave-requests.api.ts` -- API client with types externalized
- `features/leave-requests/api/leave-balances.api.ts` -- API client with types externalized
- `features/leave-requests/hooks/use-leave-requests.ts` -- 5 hooks: useLeaveRequests, useMyLeaveRequests, useSubmitLeaveRequest, useUpdateLeaveRequest, useCancelLeaveRequest
- `features/leave-requests/hooks/use-leave-balances.ts` -- useLeaveBalances hook
- `features/leave-requests/hooks/use-leave-types.ts` -- useLeaveTypes hook (reads from config feature)
- `features/leave-requests/hooks/use-approval-configs.ts` -- useMaxLevelByType hook
- `features/leave-requests/components/leave-new-page.tsx` -- migrated from Zustand store
- `features/leave-requests/components/leave-my-page.tsx` -- migrated from Zustand store (loading skeleton, error handling)
- `features/leave-requests/index.ts` -- barrel export
- `features/config/api/leave-types.api.ts` -- owns LeaveTypeDto CRUD
- `features/config/api/config.api.ts` -- owns ConfigDto API
- `features/config/index.ts` -- barrel export

**Files updated:**
- `src/app/router.tsx` -- imports changed to `@/features/leave-requests` and `@/features/config`

**Bug found during code review (H1):**
The API client returns `{data, error}` -- it does NOT throw on HTTP errors. Mutations call `mutateAsync(formData)` and treat any non-error result as success. When the API returns a 400 with validation errors, the mutation resolves with `{data: null, error: {...}}` -- no throw, no error state in TanStack Query, no toast.

**Fix:**
```typescript
// Added to API client
function unwrap<T>(result: { data?: T; error?: ApiError }): T {
  if (result.error) throw new ApiError(result.error.message, result.error.status);
  return result.data as T;
}

// Usage in mutation
const { mutateAsync } = useMutation({
  mutationFn: (dto: CreateLeaveRequestDto) =>
    postApiLeaveRequests(dto).then(unwrap),
});
```

**Cache invalidation fix (M1):**
Submit/update/cancel mutations now invalidate both keys:
```typescript
queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
```

## What We Tried

1. **unwrap() helper** -- Considered throwing inside the API client's `postApiLeaveRequests` directly, but that would break the existing callers still using the old pattern (error destructuring). The helper isolates the behavioral change to VSA consumers only.

2. **Config API placement** -- Two options: (a) duplicate leave-types API in features/config and features/leave-requests, or (b) create a clean import from features/config. Chose (b) despite it requiring an early config feature init because duplicating API modules is the kind of technical debt that never gets cleaned up.

3. **LeaveNewPage migration scope** -- Considered rewriting the entire form component with react-hook-form. Scoped down to just replacing `useStore` calls with hooks. The form itself works; migrating it to a proper form library belongs in a separate improvement pass.

## Root Cause Analysis

The silent mutation failure (H1) traces back to the API client's design choice: returning `{data, error}` instead of throwing. This pattern works fine for queries where errors surface through the `error` field naturally, but for mutations, `useMutation` only enters the `error` state if the promise rejects. A resolved promise with `{error: ...}` looks like success.

The root mistake was not standardizing the API client's error contract before starting the migration. We treated the API layer as "done" and focused only on the feature slice. Next time, the API layer fix should be part of the migration phase itself.

## Lessons Learned

1. **Mutation error handling must be explicit.** TanStack Query only catches rejected promises. Any API client that returns `{data, error}` instead of throwing will silently swallow errors in mutations unless you add an unwrap layer.

2. **Cross-feature imports need structural decisions, not just imports.** The leave-requests/leavetypes boundary looks like a simple import chain, but it forced the config feature to exist as a real module with its own API files. If we'd deferred, we'd have a circular dependency or a shared types file that belongs nowhere.

3. **Old API files are technical debt with a timer.** The dual data path (TanStack Query + Zustand) is risky. Every remaining phase that touches leave-requests data increases the chance of cache inconsistency. There's no elegant fix -- just finish the remaining phases quickly.

4. **The code review caught a real bug.** Build passes, tests pass, but the mutation silently succeeds on errors. This validates the review step in the workflow. Skipping it on future phases would be a mistake.

## Next Steps

- Phase 6-12 are the remaining pages: approval, calendar, summary, reports, violations, config, and cleanup
- After Phase 6 (approval), no more pages consume `useStore` for leave-requests data, and the old API files can be deleted
- Phase 12 will delete `useStore.ts` entirely
- No unresolved questions or blockers for the next phase
