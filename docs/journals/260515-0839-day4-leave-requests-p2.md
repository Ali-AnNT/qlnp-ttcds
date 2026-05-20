# LeaveRequests P2 -- Approve/Reject/Cancel

**Date**: 2026-05-20
**Severity**: Medium
**Component**: LeaveRequests API
**Status**: Resolved

## What Happened

Implemented Approve, Reject, Cancel endpoints for LeaveRequests, completing the full CRUD slice (AC-007 through AC-012).

## The Brutal Truth

Straightforward phase -- no surprise edge cases. The hardest part was convincing ourselves that lazy-initializing LeaveBalance on approve is safe rather than requiring a pre-seed migration. It is, but it smells.

## Technical Details

- `ApprovedBy = currentUser.UserId` -- not hardcoded to Director role on principle.
- `LeaveBalance.UsedDays` updated only on `approved_director` status transition.
- `LD.PCM` scope check gates director-level approval.
- Cancel uses `DELETE` (soft-delete via `DeletedAt`), not a status flip.

## Root Cause

No root cause -- this was additive, not fixing a bug.

## Lessons Learned

Lazy-init of aggregates (LeaveBalance on first approval) avoids migration debt but defers the schema constraint problem. Acceptable for MVP.

## Next Steps

Move to Attendance/CheckIn endpoints.
