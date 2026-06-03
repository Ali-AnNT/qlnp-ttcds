---
phase: 2
title: "Frontend: New hook + simplify approval-page"
status: pending
priority: P2
effort: "1.5h"
dependencies: [1]
---

# Phase 2: Frontend — New hook + simplify approval-page

## Overview

Tạo `useApprovableRequests` hook gọi `GET /leave-requests/approvable`, thay thế `useApprovalRequests` + `useApprovalConfigs` + `visibleRequests` useMemo. Simplify `approval-page.tsx`.

## Requirements

- **Functional:** Approval page hiển thị đúng danh sách đơn có thể phê duyệt, gọi 1 API duy nhất
- **Non-functional:** Giữ nguyên UX (loading skeleton, empty state, approve/reject/detail actions)

## Architecture

```
Before:
  approval-page.tsx
    ├── useApprovalRequests()  → GET /leave-requests?status=pending
    ├── useApprovalConfigs()   → GET /system-configs/leave-configs
    ├── useQuery("departments") → GET /departments
    ├── visibleRequests = useMemo(filter by flow + role + dept)
    ├── useApproveLeaveRequest()
    └── useRejectLeaveRequest()

After:
  approval-page.tsx
    ├── useApprovableRequests() → GET /leave-requests/approvable
    ├── useQuery("departments") → GET /departments (still needed for display)
    ├── useApproveLeaveRequest()
    └── useRejectLeaveRequest()
```

## Related Code Files

- **Create:** `packages/web/src/features/leave-requests/api/leave-requests.api.ts` (add approvable method)
- **Create:** `packages/web/src/features/approval/hooks/use-approvable-requests.ts`
- **Modify:** `packages/web/src/features/approval/components/approval-page.tsx` (simplify)
- **Modify:** `packages/web/src/features/approval/components/approval-table.tsx` (minor: remove maxLevelByType if no longer needed)
- **Modify:** `packages/web/src/features/approval/components/detail-dialog.tsx` (minor: keep maxLevelByType for status label display)

## Implementation Steps

1. Add `approvable` method to `leave-requests.api.ts`:
   ```typescript
   approvable: () => api.get<LeaveRequestDto[]>("/leave-requests/approvable"),
   ```

2. Create `use-approvable-requests.ts`:
   ```typescript
   import { useQuery } from "@tanstack/react-query";
   import { leaveRequestsApi } from "@/features/leave-requests";

   export function useApprovableRequests() {
     return useQuery({
       queryKey: ["leave-requests", "approvable"],
       queryFn: async () => {
         const res = await leaveRequestsApi.approvable();
         return res.data ?? [];
       },
     });
   }
   ```

3. Simplify `approval-page.tsx`:
   - Remove imports: `useApprovalConfigs`, `useApprovalRequests`, `useLeaveTypes`
   - Remove: `useApprovalConfigs()`, `useApprovalRequests()`, `useLeaveTypes()`
   - Remove: `visibleRequests` useMemo
   - Add: `useApprovableRequests()` 
   - Replace: `visibleRequests` → `data` from `useApprovableRequests`
   - Keep: `departments` query (needed for display in table/detail)
   - Keep: `useApproveLeaveRequest()`, `useRejectLeaveRequest()`
   - Remove: `leaveTypes` prop from `ApprovalTable` and `DetailDialog` — leave type name comes from DTO's `leaveTypeName`
   - Keep: `maxLevelByType` for status label display — BUT we need approval configs for this. Options:
     - Option A: Keep `useApprovalConfigs` just for `maxLevelByType` (status label display)
     - Option B: Add `maxApprovalLevel` to LeaveRequestDto from BE
     - **Decision: Option A** — KISS, don't modify DTO. Config call is lightweight and only needed for display label.

4. Update `approval-table.tsx`:
   - Remove `leaveTypes` prop (leaveTypeName already in DTO)
   - Keep `maxLevelByType` prop (still needed for status label)

5. Update `detail-dialog.tsx`:
   - Remove `leaveTypes` prop (leaveTypeName already in DTO)
   - Keep `maxLevelByType` prop (still needed for status label)

## Success Criteria

- [ ] `useApprovableRequests` hook returns data from `/leave-requests/approvable`
- [ ] `approval-page.tsx` uses only `useApprovableRequests` + `useApprovalConfigs` (for display only) + departments query
- [ ] `visibleRequests` useMemo removed
- [ ] `useApprovalRequests` import removed from approval-page
- [ ] Approval table displays correctly with approvable data
- [ ] Loading skeleton and empty state still work
- [ ] Approve/reject/detail actions still work
- [ ] No TypeScript compile errors

## Risk Assessment

| Risk | Mitigation |
|------|-------------|
| Status label needs maxLevelByType which requires configs | Keep `useApprovalConfigs` for display — it's a lightweight GET, only used for label calculation, not filtering |
| Removing leaveTypes prop may break table/detail | DTO already has `leaveTypeName` field — use that instead of lookups |

## Security Considerations

- No change — auth handled by BE endpoint