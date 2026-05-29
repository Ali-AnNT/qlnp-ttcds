---
phase: 5
title: "Leave Requests"
status: pending
priority: P1
effort: "1h"
dependencies: [1, 2, 3]
---

# Phase 5: Leave Requests

## Overview

Migrate leave requests feature (LeaveNewPage, LeaveMyPage, related APIs) into `features/leave-requests/`. This is the core CRUD feature of the application — most complex migration.

## Requirements

- Functional: Create, view, edit, cancel leave requests all work unchanged
- Non-functional: Replace Zustand store usage with TanStack Query mutations + local state

## Architecture

```
features/leave-requests/
├── api/
│   ├── leave-requests.api.ts   # From src/api/leave-requests.api.ts
│   ├── leave-balances.api.ts   # From src/api/leave-balances.api.ts
│   └── types.ts                # LeaveRequestDto, CreateLeaveRequestDto, LeaveBalanceDto
├── components/
│   ├── leave-new-page.tsx      # From src/pages/LeaveNewPage.tsx (137 lines)
│   ├── leave-my-page.tsx       # From src/pages/LeaveMyPage.tsx (255 lines)
│   ├── leave-my-table.tsx      # Extracted from LeaveMyPage
│   ├── leave-edit-dialog.tsx   # Extracted from LeaveMyPage
│   └── leave-balance-card.tsx  # Re-export from dashboard or shared if needed
├── hooks/
│   ├── use-leave-requests.ts   # TanStack Query: list + mutations
│   ├── use-leave-balances.ts   # TanStack Query: balances query
│   └── use-submit-leave-request.ts # TanStack Query: create mutation
└── index.ts
```

<!-- Updated: Validation Session 1 - leave-types.api.ts moved to config feature; leave-requests imports LeaveTypeDto from config public API -->

## Related Code Files

- Move: `src/api/leave-requests.api.ts` → `features/leave-requests/api/leave-requests.api.ts`
- Move: `src/api/leave-balances.api.ts` → `features/leave-requests/api/leave-balances.api.ts`
- **NOT moved**: `src/api/leave-types.api.ts` → goes to `features/config/api/` (config owns CRUD); leave-requests imports `LeaveTypeDto` from `@/features/config`
- Move: `src/pages/LeaveNewPage.tsx` → `features/leave-requests/components/leave-new-page.tsx`
- Move: `src/pages/LeaveMyPage.tsx` → `features/leave-requests/components/leave-my-page.tsx`
- Check: `src/components/LeaveRequestForm.tsx` — appears unused, verify then delete
- Create: API types file, hooks, `index.ts`

## Implementation Steps

1. Create directory:
   ```bash
   mkdir -p src/features/leave-requests/{api,components,hooks}
   ```

2. Move API modules:
   ```bash
   mv src/api/leave-requests.api.ts src/features/leave-requests/api/leave-requests.api.ts
   mv src/api/leave-balances.api.ts src/features/leave-requests/api/leave-balances.api.ts
   # NOTE: leave-types.api.ts goes to features/config/ — config owns CRUD
   # leave-requests imports LeaveTypeDto from @/features/config
   ```

3. Extract shared types into `api/types.ts`:
   - `LeaveRequestDto`, `CreateLeaveRequestDto` from leave-requests.api
   - `LeaveBalanceDto` from leave-balances.api
   - `LeaveTypeDto` — imported from `@/features/config` (config owns it)

4. Move pages:
   ```bash
   mv src/pages/LeaveNewPage.tsx src/features/leave-requests/components/leave-new-page.tsx
   mv src/pages/LeaveMyPage.tsx src/features/leave-requests/components/leave-my-page.tsx
   ```

5. Check LeaveRequestForm usage — if unused, delete `src/components/LeaveRequestForm.tsx`

6. Extract components from LeaveMyPage (255 lines):
   - `leave-my-table.tsx`: Table rendering logic
   - `leave-edit-dialog.tsx`: Edit dialog (if present)

7. Create TanStack Query hooks:
   ```typescript
   // hooks/use-leave-requests.ts
   export function useLeaveRequests() {
     return useQuery({ queryKey: ['leave-requests'], queryFn: () => leaveRequestsApi.list() });
   }
   // hooks/use-submit-leave-request.ts
   export function useSubmitLeaveRequest() {
     return useMutation({ mutationFn: leaveRequestsApi.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-requests'] }) });
   }
   ```

8. Update all imports in leave-requests components:
   - `@/store/useStore` → local hooks
   - `@/api/*` → relative `../api/*`
   - `@/contexts/AuthContext` → `@/features/auth`
   - `@/components/ui/*` → `@/shared/ui/*`

9. Create barrel export:
   ```typescript
   // features/leave-requests/index.ts
   export { LeaveNewPage } from './components/leave-new-page';
   export { LeaveMyPage } from './components/leave-my-page';
   export { useLeaveRequests } from './hooks/use-leave-requests';
   export { useLeaveBalances } from './hooks/use-leave-balances';
   export type { LeaveRequestDto, CreateLeaveRequestDto, LeaveBalanceDto } from './api/types';
   // Note: LeaveTypeDto is owned by config feature — import from @/features/config
   ```

10. Update `app/router.tsx` imports

11. Update Zustand store: remove leave-requests, leave-balances, leave-types from `useStore`

12. Delete old files

13. Build and verify: `bun run build`

## Success Criteria

- [ ] Leave requests feature self-contained in `features/leave-requests/`
- [ ] Create new leave request works
- [ ] View my leave requests table works
- [ ] Edit/cancel leave requests works
- [ ] Leave balances display correctly
- [ ] No Zustand store usage for leave-request data
- [ ] Types exported from public API
- [ ] `bun run build` passes

## Risk Assessment

- **Store decoupling**: leave-requests, leave-balances, leave-types are currently in Zustand store. Must ensure all pages that reference them are updated.
- **Type exports**: Other features (approval, calendar, summary, violations) consume LeaveRequestDto — they'll import from leave-requests public API.
- **LeaveTypeDto source**: Config owns leave-types CRUD and LeaveTypeDto type. Leave-requests and other features import from `@/features/config`. This was validated — avoids type drift. <!-- Updated: Validation Session 1 - leave-types owned by config -->
- **LeaveRequestForm**: Verify unused before deleting.
