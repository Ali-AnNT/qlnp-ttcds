---
phase: 3
title: "Update frontend test"
status: pending
priority: P2
effort: "10m"
dependencies: []
---

# Phase 3: Update frontend test

## Overview

Update the frontend test file that references old leave type codes and IDs.

## Requirements

- Replace `reason: "sick"` with updated Vietnamese code (or keep as user-entered reason — the `reason` field is free text, not a code reference)
- Verify no other frontend files reference old leave type codes

## Related Code Files

- Modify: `packages/web/src/test/useStore.test.ts` (lines 138-158)

## Implementation Steps

1. Check if `reason: "sick"` is a LeaveType code or a free-text reason:
   - If code: update to "NO"
   - If free-text reason: leave as-is (it's the user's reason for the request, not a LeaveType reference)
2. Check `leaveTypeId: 1` references — these are FK references to LeaveType.Id. Id=1 still maps to "Nghỉ phép năm" (was annual, now NPN), so the FK is still valid.
3. Search entire frontend for any other references to "annual", "sick", "personal" as LeaveType codes

## Success Criteria

- [ ] Frontend test references are consistent with new LeaveType data
- [ ] `leaveTypeId: 1` references still valid (Id=1 exists in seed)
- [ ] No stale LeaveType code references remain
- [ ] `npm test` passes

## Risk Assessment

Minimal — test data only. No production code references found.