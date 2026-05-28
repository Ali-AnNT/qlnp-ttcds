# Configurable N-Level Approval Flow Implementation

**Date**: 2026-05-27
**Severity**: High
**Component**: Leave Approval System
**Status**: Resolved

## What Happened

Refactored the leave approval system from hardcoded 1/2-level branching logic to a fully configurable N-level approval flow. Each LeaveType now drives its own approval depth (1-N levels) via the new `approvalLevelCount` field, with OR-logic support for multi-role approvers at the same level.

The migration from `approved_leader` boolean status to `ApprovedLevel` integer field was particularly painful — required backfilling 25 existing requests to `pending` with `ApprovedLevel=1`, simulating a fresh start where no one had ever approved anything.

## The Brutal Truth

This was a larger blast radius than anticipated. 19 files touched across backend and frontend. The approval logic rewrite meant every single page that displayed leave status or handled approval actions needed updating. The cancel flow alone required changes in 5 places to properly restrict cancellation to only pending/partially-approved requests.

The seed data configuration was tedious — 9 LeaveConfig rows where NKL gets 1-level (no team lead approval) and everything else gets 2-level. One misconfigured seed row and the whole thing breaks in production.

## Technical Details

**Backend changes:**
- `LeaveRequest` entity: replaced `approved_leader` (bool) with `ApprovedLevel` (int, nullable)
- `LeaveType` entity: added `approvalLevelCount` field
- `ApproveEndpoint.cs`: N-level traversal logic, OR-logic role checking at same level
- `RejectEndpoint.cs`: full reset to pending with ApprovedLevel=0
- `CancelEndpoint.cs`: restricted to pending or partially approved only
- `LeaveConfigs`: 9 seed rows with level configurations

**Frontend changes:**
- `ApprovalPage`: N-level display with "Level X of Y" indicators
- `LeaveMyPage`, `DashboardPage`, `CalendarPage`, `SummaryPage`, `ReportsPage`, `ViolationsPage`: status display updates
- `LeaveNewPage`: approval preview based on LeaveType config

**Migration executed:**
```sql
UPDATE "LeaveRequests" SET "status" = 'pending', "ApprovedLevel" = 1 
WHERE "status" = 'approved';
```

## Key Decisions

1. **OR-logic for same-level multi-role**: If multiple roles can approve at level X, any one of them approves — no need for all.
2. **Balance deduction on final approval only**: `BalanceDeducted` flag set only when `ApprovedLevel == approvalLevelCount` — never mid-approval.
3. **Cancel restrictions**: Only requests in `pending` or `approved` (but not fully approved) can be cancelled.
4. **approved_leader semantics**: Treated as "at least level 1 approved" → migrated to `ApprovedLevel=1`.

## Lessons Learned

- Approval state machines are deceptively complex — what looks like a simple boolean flip has cascading effects on every consumer of that state.
- Config-driven logic requires more thorough testing across all permutations (1-level, 2-level, 3-level, different role combinations).
- Seed data changes should be treated like migration scripts — versioned, tested, rollbackable.

## Next Steps

- Add integration tests for edge cases: mid-approval cancellation, role hierarchy conflicts
- Document the approval flow configuration in admin docs
- Consider adding audit trail for level-by-level approvals
