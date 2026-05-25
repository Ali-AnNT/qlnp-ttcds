---
title: "T-01: LeaveRequestAudit Entity + Migration"
description: "Create LeaveRequestAudit entity + DbSet + FK config + EF Core migration. Strictly entity layer — no service/interface/wiring (T-03 handles wiring later)."
status: pending
priority: P1
branch: "dev"
tags: [dotnet, ef-core, audit, entity]
blockedBy: []
blocks: [T-03-audit-wiring, T-04-history-endpoint]
created: "2026-05-21"
createdBy: "ck:plan"
source: skill
---

# T-01: LeaveRequestAudit Entity + Migration

## Overview

Add `LeaveRequestAudit` entity to support BRULE-010 audit logging. Entity + migration only — no service wiring (deferred to T-03).

## Requirements

- **BRULE-010**: Track who changed what, when, old/new values for every LeaveRequest mutation
- **FR-05.7/05.8**: Approver updates → audit; display audit in request detail
- **FR-11.3**: Every change recorded: field, old value, new value, actor, timestamp
- **SRS schema**: Id, LeaveRequestId (FK), ChangedBy (FK USER_MASTER), ChangedAt, FieldName, OldValue, NewValue

## Design Decisions (from brainstorm)

1. **Explicit table** (not EF Core shadow properties) — queryable, matches existing patterns
2. **OldValue/NewValue as nvarchar(max)** — `.ToString()` on save, parse on read
3. **Nav property on LeaveRequest** — `ICollection<LeaveRequestAudit> Audits` (matches LeaveType→Requests pattern)
4. **Scope: entity + migration only** — no IAuditService, no wiring interface

## Entity Schema

```
LeaveRequestAudit
  Id              long            PK, identity
  LeaveRequestId  long            FK → LeaveRequests.Id (cascade)
  ChangedBy       long            FK → USER_MASTER.UserMasterId (restrict)
  ChangedAt       datetime2       default SYSUTCDATETIME()
  FieldName       nvarchar(100)   e.g. "StartDate", "Status", "Reason"
  OldValue        nvarchar(max)   nullable (null for initial create)
  NewValue        nvarchar(max)   nullable

Nav props:
  LeaveRequest LeaveRequest    (required)
  UserMaster   ChangedByUser   (nullable — system read-only table)
```

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Create Entity](./phase-01-create-entity.md) | Pending |
| 2 | [Update AppDbContext](./phase-02-update-appdbcontext.md) | Pending |
| 3 | [Generate Migration](./phase-03-generate-migration.md) | Pending |
| 4 | [Verify Build](./phase-04-verify-build.md) | Pending |

## Dependencies

- **blocks**: T-03 (audit wiring needs entity), T-04 (history endpoint reads audits)
- **blockedBy**: none

## Validation Log

### Session 1 — 2026-05-21
**Trigger:** User requested validation before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Plan specifies cascade delete on LeaveRequestAudits → LeaveRequests. When a LeaveRequest is deleted, should its audit trail also be deleted?
   - Options: Cascade delete | Restrict | Set null
   - **Answer:** Cascade delete (Recommended)
   - **Rationale:** Simple, no orphaned audits. Deletion of requests removes their full history.

2. **[Assumptions]** ChangedBy as long (non-nullable) — should it allow null for system-initiated changes?
   - Options: Required (non-nullable) | Nullable
   - **Answer:** Required (non-nullable) (Recommended)
   - **Rationale:** Forces audit accountability. Every mutation has an actor.

3. **[Tradeoffs]** Plan specifies index only on LeaveRequestId. Need additional indexes now?
   - Options: Single index on LeaveRequestId | Composite (LeaveRequestId, ChangedAt) | Add index on ChangedBy
   - **Answer:** Single index on LeaveRequestId (Recommended)
   - **Rationale:** YAGNI — queries start from a request. Add indexes later if needed.

#### Confirmed Decisions
- FK cascade delete: confirmed — audit rows deleted with parent request
- ChangedBy non-nullable: confirmed — every audit row requires an actor
- Single index on LeaveRequestId: confirmed — defer additional indexes

#### Verification Results
- **Tier:** Standard (Fact Checker + Contract Verifier)
- **Claims checked:** 10
- **Verified:** 10 | **Failed:** 0 | **Unverified:** 0
- All file paths, symbols, patterns, conventions confirmed against live codebase

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-create-entity.md, phase-02-update-appdbcontext.md, phase-03-generate-migration.md, phase-04-verify-build.md
- Decision deltas checked: 3
- Reconciled stale references: 0
- Unresolved contradictions: 0
