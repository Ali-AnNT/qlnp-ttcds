---
phase: 3
title: "Frontend Type Updates"
status: complete
priority: P1
effort: "2h"
dependencies: [2]
---

# Phase 3: Frontend Type Updates

## Overview

Update all frontend files to remove `approved_leader` and `approved_director` status references, add `approvedLevel` to DTO types, and update status display logic to use `ApprovedLevel` for progress indication.

## Requirements

- Functional: `LeaveStatus` type updated to remove `approved_leader` and `approved_director`
- Functional: `LeaveRequestDto` interface includes `approvedLevel: number`
- Functional: All status label maps and filter logic updated
- Functional: Status display shows approval progress with role-aware labels (cấp 1 = "TP đã duyệt", cấp 2 = "BGĐ đã duyệt", cấp 3+ = "Cấp N đã duyệt")
- Non-functional: No `approved_leader` references remain in frontend code

## Architecture

**Status type change:**
```typescript
// Before
export type LeaveStatus = "pending" | "approved_leader" | "approved" | "rejected" | "cancelled";

// After
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
```

**Progress display logic (role-aware level labels):**
```typescript
// Level labels: cấp 1 = "TP đã duyệt", cấp 2 = "BGĐ đã duyệt", cấp 3+ = generic
const APPROVAL_LEVEL_LABELS: Record<number, string> = {
  1: "TP đã duyệt",    // Trưởng phòng
  2: "BGĐ đã duyệt",   // Ban giám đốc
};

function getApprovalStatusText(status: LeaveStatus, approvedLevel: number, maxLevel: number): string {
  if (status === "approved") return "Đã duyệt";
  if (status === "rejected") return "Từ chối";
  if (status === "cancelled") return "Đã hủy";
  if (status === "pending" && approvedLevel > 0) {
    // Show named label for levels 1-2, generic for 3+
    const levelLabel = APPROVAL_LEVEL_LABELS[approvedLevel] ?? `Cấp ${approvedLevel}`;
    return maxLevel > approvedLevel ? `${levelLabel} (cấp ${approvedLevel}/${maxLevel})` : levelLabel;
  }
  if (status === "pending") return "Chờ duyệt";
  return status;
}

function getApprovalStatusColor(status: LeaveStatus, approvedLevel: number, maxLevel: number): string {
  if (status === "approved") return "bg-success/10 text-success border-success/30";
  if (status === "rejected") return "bg-red-100 text-red-700 border-red-300";
  if (status === "cancelled") return "bg-gray-100 text-gray-500 border-gray-300";
  if (status === "pending" && approvedLevel > 0 && approvedLevel < maxLevel)
    return "bg-blue-100 text-blue-700 border-blue-300"; // partially approved
  if (status === "pending") return "bg-yellow-100 text-yellow-700 border-yellow-300";
  return "bg-gray-100 text-gray-500 border-gray-300";
}
```

## Related Code Files

- Modify: `packages/web/src/lib/leave-data.ts` — update LeaveStatus type, status labels, add helper
- Modify: `packages/web/src/api/leave-requests.api.ts` — add `approvedLevel` to LeaveRequestDto
<!-- Updated: Validation Session 2 - Config-driven ApprovalPage filtering -->
- Modify: `packages/web/src/pages/ApprovalPage.tsx` — update filtering logic for N-level
- Modify: `packages/web/src/pages/LeaveMyPage.tsx` — update status display
- Modify: `packages/web/src/pages/DashboardPage.tsx` — update status labels and filters
- Modify: `packages/web/src/pages/CalendarPage.tsx` — update status labels and filters
- Modify: `packages/web/src/pages/SummaryPage.tsx` — update approved filter
- Modify: `packages/web/src/pages/ReportsPage.tsx` — update approved filter
- Modify: `packages/web/src/pages/LeaveNewPage.tsx` — update overlap check filter
- Modify: `packages/web/src/pages/ViolationsPage.tsx` — update approved_leader filter

## Implementation Steps

1. **Update `leave-data.ts`**:
   - Remove `approved_leader` and `approved_director` from `LeaveStatus` type
   - Update `leaveStatusLabels` to remove those entries
   - Add `getApprovalStatusLabel(status, approvedLevel, maxLevel)` helper function
   - Add `getApprovalStatusColor(status, approvedLevel, maxLevel)` helper function

2. **Update `leave-requests.api.ts`**:
   - Add `approvedLevel: number` to `LeaveRequestDto` interface

3. **Update `ApprovalPage.tsx`**:
   - Replace `singleLevelLeaveTypeIds` logic with config-driven filtering:
     - Load approval configs (already loaded via `configApi.get()`)
     - For each request: look up configs for its LeaveType, find which level matches the user's role at `request.approvedLevel + 1`
     - Show only requests where the current user's role is a valid approver at the next level
     - GD.PGD: sees requests where `status = "pending"` AND their role is in configs for `ApprovedLevel + 1` (any level)
     - LD.PCM: sees requests where `status = "pending"` AND LD.PCM is in configs for `ApprovedLevel + 1` AND same department
   - Remove `approved_leader` filter references
   - Show role-aware status: "TP đã duyệt (cấp 1/2)" for level 1, "BGĐ đã duyệt" for level 2, "Cấp N đã duyệt" for 3+

4. **Update `LeaveMyPage.tsx`**:
   - Remove `approved_leader` from status labels and badge colors
   - Show approval progress using `approvedLevel` and config max level
   - Update overlap check filter: remove `approved_leader` condition

5. **Update `DashboardPage.tsx`**:
   - Remove `approved_leader` and `approved_director` from status label maps
   - Update approved count filter to only use `approved`
   - Update progress filter

6. **Update `CalendarPage.tsx`**:
   - Same changes as DashboardPage for status labels

7. **Update `SummaryPage.tsx`**:
   - Update `isApproved` filter to only check `approved`

8. **Update `ReportsPage.tsx`**:
   - Update approved filter to only check `approved`

9. **Update `LeaveNewPage.tsx`**:
   - Update overlap check: remove `approved_leader` condition from date overlap filter

10. **Update `ViolationsPage.tsx`**:
    - Update approved filter: remove `approved_leader` condition

## Success Criteria

- [ ] No `approved_leader` or `approved_director` references in frontend code
- [ ] `LeaveRequestDto` includes `approvedLevel` field
- [ ] `LeaveStatus` type only has `pending | approved | rejected | cancelled`
- [ ] Approval progress displayed with role-aware labels: "TP đã duyệt (cấp 1/2)" for level 1, "BGĐ đã duyệt (cấp 2/2)" for level 2, "Cấp N đã duyệt" for level 3+
- [ ] ApprovalPage filters requests correctly based on current user's role and config
- [ ] TypeScript compilation succeeds with no errors
- [ ] All pages render correctly with new status handling

## Risk Assessment

- **Backend-frontend deploy order**: Backend must be deployed first with `approved_leader` migration complete. Frontend can then be deployed. During transition, frontend will see `pending` status instead of `approved_leader` — acceptable.
- **Missing `approvedLevel` from backend**: If backend returns `approvedLevel = 0` for all requests, progress display will show "Chờ duyệt" — graceful degradation.

## Security Considerations

- Frontend must not trust `approvedLevel` alone — backend validates on every approval action
- Role-based filtering in ApprovalPage is UX only — backend enforces actual auth