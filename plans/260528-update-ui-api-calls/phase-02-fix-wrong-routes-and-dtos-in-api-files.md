---
phase: 2
title: "Fix wrong routes and DTOs in API files"
status: completed
priority: P1
effort: "30min"
dependencies: [1]
---

# Phase 2: Fix wrong routes and DTOs in API files

## Overview

Fix 3 API files with wrong routes, removed endpoint, and DTO shape mismatches.

## Requirements

### config.api.ts — Wrong routes
- `GET /config` → `GET /system-configs/leave-configs`
- `PUT /config` → `PUT /system-configs/leave-configs`

### leave-requests.api.ts — 3 fixes
1. **Remove `get(id)`** — no backend endpoint for single leave request
2. **Remove `totalDays`** from `CreateLeaveRequestDto` — backend computes it from `startDate`/`endDate`
3. **Fix `reject` parameter** — UI sends `{ reason }`, backend expects `{ rejectedReason }`

## Related Code Files
- Modify: `packages/web/src/api/config.api.ts`
- Modify: `packages/web/src/api/leave-requests.api.ts`

## Implementation Steps

1. **config.api.ts** — Replace both routes:
   - `"/config"` → `"/system-configs/leave-configs"` in both `get()` and `update()`

2. **leave-requests.api.ts:**
   - Remove the `get(id)` method (line 41)
   - Remove `totalDays: number` from `CreateLeaveRequestDto` interface
   - Change `reject` method from:
     ```ts
     reject: (id: number, reason?: string) =>
       api.post<LeaveRequestDto>(`/leave-requests/${id}/reject`, { reason }),
     ```
     to:
     ```ts
     reject: (id: number, rejectedReason?: string) =>
       api.post<LeaveRequestDto>(`/leave-requests/${id}/reject`, { rejectedReason }),
     ```

## Success Criteria
- [ ] `configApi.get()` calls `/system-configs/leave-configs`
- [ ] `configApi.update()` calls `/system-configs/leave-configs`
- [ ] `leaveRequestsApi.get(id)` removed
- [ ] `CreateLeaveRequestDto` has no `totalDays` field
- [ ] `reject()` sends `{ rejectedReason }` not `{ reason }`
