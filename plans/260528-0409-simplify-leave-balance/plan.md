---
title: "Simplify LeaveBalance — Single Record Per User Per Year with Config-Driven Recalculation"
description: "Remove LeaveTypeId from LeaveBalance, use min(max_annual_leave, default_days_{role}) as TotalDays. Add UserRoles table for role persistence and ILeaveBalanceService for recalculation on config change. One balance record per (UserId, Year)."
status: complete
priority: P1
branch: "dev"
tags: [leave-balance, migration, simplification, system-config, channel-service]
blockedBy: []
blocks: []
created: "2026-05-28T04:12:44.796Z"
createdBy: "ck:plan"
source: skill
---

# Simplify LeaveBalance — Single Record Per User Per Year with Config-Driven Recalculation

## Overview

Simplify LeaveBalance from per-leave-type tracking `(UserId, LeaveTypeId, Year)` to a single record per `(UserId, Year)`. TotalDays = `min(max_annual_leave, default_days_{role})` where role comes from the new `UserRoles` table. When admin updates SystemConfigs, `ILeaveBalanceService.RecalculateCurrentYearAsync()` recalculates all current-year balances. LeaveType remains on LeaveRequest for categorization and approval workflow.

**Key decisions (from brainstorm):**
- TotalDays = `min(max_annual_leave, default_days_{role})` — role from UserRoles table
- 1 record per `(UserId, Year)` — no LeaveTypeId on LeaveBalance
- Role persisted in `UserRoles(UserId, Role, UpdatedAt)` table — synced on GET /me and login
- `ILeaveBalanceService.RecalculateCurrentYearAsync()` called from SystemConfigs Update endpoint after save
- UsedDays unchanged when TotalDays decreases — remaining can go negative
- Recalculation scope: current year only
- Fallback for users without UserRole entry: `max_annual_leave` (most permissive)
- `default_days_{role}` configs remain visible on ConfigPage (they affect TotalDays)
- Cancel-approved-request UsedDays restoration: out of scope (known bug)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Entity & Migration](./phase-01-entity-migration.md) | Complete |
| 2 | [Backend Logic + Service](./phase-02-backend-logic-service.md) | Complete |
| 3 | [Frontend Updates](./phase-03-frontend-updates.md) | Complete |
| 4 | [Verification](./phase-04-verification.md) | Complete |

## Dependencies

None — this is a self-contained refactor.

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Data loss during migration | Low | Backup DB; consolidation SQL is additive (sum UsedDays) |
| UserRoles table empty at startup | Medium | Fallback to max_annual_leave; populate on login via /me |
| Cancel-approved-request bug | Existing | Out of scope; noted for future fix |
| Admin needs per-type breakdown | Medium | LeaveRequest table still has LeaveTypeId; can aggregate on demand |
| Role mismatch between JWT and DB | Low | GET /me syncs UserRole from JWT claims; recalculate uses DB as source |
| Performance: recalculate all users | Low | Single batch query; <100 users = instant. Optimize later if needed |

## Success Criteria

1. LeaveBalance table has exactly 1 row per `(UserId, Year)` — no LeaveTypeId column, has Role column
2. UserRoles table populated with roles from JWT on login
3. TotalDays = `min(max_annual_leave, default_days_{role})` for each user
4. When SystemConfigs updated → all current-year LeaveBalances recalculated
5. Dashboard "Ngày phép còn lại" = `TotalDays - UsedDays` (single value)
6. Approval flow correctly deducts UsedDays from single balance record
7. ConfigPage shows `default_days_{role}` configs (they affect TotalDays via min())
8. `dotnet build` compiles with zero errors