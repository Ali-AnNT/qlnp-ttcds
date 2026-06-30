---
phase: 1
title: "Research"
status: done
priority: P2
effort: "15min"
dependencies: []
---

# Phase 1: Research

## Overview

Verify current approval flow code, edge cases, and confirm no hidden dependencies before implementation.

## Key Insights (from brainstorm scout)

- `ApprovalHelper.cs` — core approval logic: `GetApprovalFlow`, `CanApproveAtLevel`, `GetNextLevelRoles`
- `ApproveLeaveRequestEndpoint.cs` — has private `UpsertBalanceForApprovalAsync` + `ResolveTotalDaysAsync` (needs extract)
- `CreateLeaveRequestEndpoint.cs` — currently Staff + Leader only, no auto-approve
- `LeaveConfig` table — no auto-approve flag, no schema change needed
- Zero `LeaveConfig` rows → 403 (block creation, keep as-is)

## Implementation Steps

1. Read `ApprovalHelper.cs` — verify `GetApprovalFlow` returns sorted dict, confirm flow structure
2. Read `ApproveLeaveRequestEndpoint.cs` — map `UpsertBalanceForApprovalAsync` + `ResolveTotalDaysAsync` for extraction
3. Read `CreateLeaveRequestEndpoint.cs` — confirm current create flow, identify insertion point for auto-approve
4. Read `LeaveRequest.cs` — confirm `ApprovedLevel`, `ApprovedBy`, `ApprovedAt` fields exist with correct types
5. Check `AppRoles.cs` — confirm role constants and `Priority` array for approver-role detection
6. Verify no other endpoints/middleware depend on `ApprovedLevel=0` at creation time
7. Check frontend code that might assume `pending` status after creation

## Success Criteria

- [ ] Confirmed all fields exist on LeaveRequest entity (no migration needed)
- [ ] Identified exact lines in Approve endpoint for balance logic extraction
- [ ] Confirmed no hidden consumers of `ApprovedLevel=0` assumption
- [ ] Cross-plan conflict with approvable-requests-api documented

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Other code assumes ApprovedLevel=0 at creation | LOW | Grep for `ApprovedLevel == 0` patterns |
| Frontend breaks when request returns approved | MEDIUM | DTO already has all fields; FE checks Status field |
| Balance logic extraction breaks Approve endpoint | LOW | Shared service, same logic |