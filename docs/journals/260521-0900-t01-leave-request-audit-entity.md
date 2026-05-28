# T-01: LeaveRequestAudit Entity + Migration

**Date**: 2026-05-21
**Severity**: Medium
**Component**: Domain/Entities — Audit subsystem
**Status**: Resolved

## What Happened

Implemented `LeaveRequestAudit` entity and EF Core migration to support BRULE-010 audit logging requirement. The task was scoped strictly to entity + migration — no service wiring or interface plumbing, which was explicitly deferred to T-03.

## The Brutal Truth

Scoped correctly but still had to answer 3 validation questions before touching code. Better than breaking something and having to rollback, but the back-and-forth slowed momentum. The plan itself was solid — decisions were made upfront and held.

## Technical Details

**Entity fields:**
- `Id` — long PK, identity
- `LeaveRequestId` — long FK to `LeaveRequests.Id` (cascade delete)
- `ChangedBy` — long FK to `USER_MASTER.UserMasterId` (restrict, non-nullable)
- `ChangedAt` — datetime2 default `SYSUTCDATETIME()`
- `FieldName` — nvarchar(100)
- `OldValue` — nvarchar(max), nullable (null for initial creates)
- `NewValue` — nvarchar(max), nullable

**Nav props:** `LeaveRequest` (required), `ChangedByUser` (UserMaster)

**Migration:** `Migrations/yyyyMMddHHmm_LeaveRequestAuditTable.cs`

## What We Tried

1. **Cascade vs restrict on LeaveRequestId FK** — chose cascade. Rationale: when a LeaveRequest is deleted, its audit trail dies with it. No orphaned audit rows.
2. **ChangedBy nullable vs required** — chose required (non-nullable). Forces every audit row to have an actor. System-initiated changes still have a user account behind them in this org.
3. **Index strategy** — single index on `LeaveRequestId` only. Deferred composite `(LeaveRequestId, ChangedAt)` and `ChangedBy` indexes. YAGNI — queries always start from a request.

## Root Cause Analysis

This was a greenfield entity with no existing patterns to conflict with. Decisions were clean because BRULE-010 is explicit: track who changed what, when, old/new values. The schema follows directly from the requirement. No ambiguity, no trade-offs that required real sacrifice.

## Lessons Learned

- **Validation before code is cheaper than rollback** — the 3 questions felt like friction but prevented potentially expensive schema changes later.
- **Single-responsibility scoping held** — resisting the urge to wire `IAuditService` in the same PR kept the task small and reviewable. T-03 owns that.
- **YAGNI on indexes is defensible** — adding indexes preemptively "just in case" is technical debt you pay upfront. Measure first.

## Next Steps

- T-03: Wire `IAuditService` into `LeaveRequestService` — actually write audit rows on mutations
- T-04: Expose audit history via API endpoint (FR-05.7/05.8)
- No immediate migration concerns — existing `LeaveRequest` rows have no audit history (by design, not a gap)
