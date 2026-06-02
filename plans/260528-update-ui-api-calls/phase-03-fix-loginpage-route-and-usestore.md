---
phase: 3
title: "Fix LoginPage route and useStore"
status: completed
priority: P1
effort: "15min"
dependencies: [2]
---

# Phase 3: Fix LoginPage route and useStore

## Overview

Fix 2 consumer files that use wrong routes or send fields the backend doesn't expect.

## Requirements

### LoginPage.tsx — Wrong dev-login route
- Calls `POST /auth/dev/login` but backend route is `POST /api/auth/dev-login`
- Client adds `/api` prefix via `API_URL` (defaults to `http://localhost:8003/api`)
- So frontend path should be `/auth/dev-login` not `/auth/dev/login`

### useStore.ts — Sends `totalDays`
- `addLeaveRequest` passes `totalDays: days` but backend ignores it (computed server-side)
- After Phase 2 removes `totalDays` from `CreateLeaveRequestDto`, the store must stop sending it

## Related Code Files
- Modify: `packages/web/src/pages/LoginPage.tsx`
- Modify: `packages/web/src/store/useStore.ts`

## Implementation Steps

1. **LoginPage.tsx:34** — Change:
   ```ts
   // Before
   const { data, error } = await api.post<{ token: string }>(
     "/auth/dev/login",
     { userName: devUser },
   );
   // After
   const { data, error } = await api.post<{ token: string }>(
     "/auth/dev-login",
     { userName: devUser },
   );
   ```

2. **useStore.ts:66-72** — Remove `totalDays` from `addLeaveRequest` call:
   ```ts
   // Before
   await addLeaveRequest({
     leaveTypeId: Number(leaveTypeId),
     startDate,
     endDate,
     totalDays: days,
     reason,
   });
   // After
   await addLeaveRequest({
     leaveTypeId: Number(leaveTypeId),
     startDate,
     endDate,
     reason,
   });
   ```

3. Verify `useStore` type for `addLeaveRequest` still matches updated `CreateLeaveRequestDto` (no `totalDays`).

## Success Criteria
- [ ] LoginPage dev-login calls `/auth/dev-login`
- [ ] `useStore.addLeaveRequest` no longer sends `totalDays`
- [ ] TypeScript compiles without errors
