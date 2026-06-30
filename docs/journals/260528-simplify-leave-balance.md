# Simplify LeaveBalance — Single Record Per User Per Year

**Date**: 2026-05-28 04:09
**Severity**: High
**Component**: LeaveBalance / UserRoles / SystemConfigs
**Status**: Resolved

## What Happened

Ripped LeaveTypeId out of LeaveBalance. The old model tracked balance per (UserId, LeaveTypeId, Year) — one row per leave type per user per year. That was wrong for this domain: "ngay phep" (annual leave) is a single pool. Leave type is just categorization on the request, not a separate budget. Consolidated to 1 record per (UserId, Year), TotalDays driven by config + role.

## The Brutal Truth

The original per-type LeaveBalance was an over-normalization that never matched the business rule. Admins had one pool of days but the code pretended each type (NPN, phep nam, etc.) had its own ledger. This caused CorrectNpnBalanceAsync — a 40-line hack that "corrected" NPN balances by shuffling days between types. Every approval path had to know which type to debit. It was fragile and nobody could explain why it existed. Ripping it out felt like pulling off a bandage that had been there too long.

## Technical Details

- **LeaveBalance entity**: removed `LeaveTypeId`, `LeaveType` navigation; added `Role` (nullable nvarchar(50)). Unique index changed from `(UserId, LeaveTypeId, Year)` to `(UserId, Year)`.
- **Migration**: consolidates existing rows via `SUM(UsedDays)` grouped by (UserId, Year). TotalDays recomputed as `min(max_annual_leave, default_days_{role})`. Fallback to `max_annual_leave` when no UserRole entry.
- **UserRoles table**: new entity `UserRole(UserId PK, Role, UpdatedAt)`. FK to USER_MASTER. Populated on GET /me and DevLogin by upserting from JWT claims.
- **ILeaveBalanceService.RecalculateCurrentYearAsync()**: reads all `default_days_{role}` configs + `max_annual_leave`, joins LeaveBalances with UserRoles, sets `TotalDays = min(max, roleDefault)`. Called from SystemConfigs/Update endpoint after `ReplaceAllAsync`.
- **Removed**: `CorrectNpnBalanceAsync`, `ResolveTotalDays` helper, LeaveTypeId/LeaveTypeName from DTO, multi-type reduce logic on DashboardPage.
- **UsedDays when TotalDays shrinks**: unchanged. Remaining can go negative. This is intentional — you cannot un-spend days already taken.

## What We Tried

- Initial brainstorm considered keeping per-type balances with a "primary type" flag. Rejected: adds complexity for zero business value.
- Considered recalculating historical years. Rejected: only current year matters for active balances, and recalculating past years risks data integrity issues.
- Considered blocking TotalDays decreases when UsedDays exceeds new TotalDays. Rejected: admin should be free to lower the cap; negative remaining is a signal, not an error.

## Root Cause Analysis

The per-type LeaveBalance was a schema-driven assumption that each leave type needed its own budget. The domain never required it — annual leave is one pool, and leave types are just request categorization for approval routing. The schema was designed before the business rules were clear, and the correction hack (CorrectNpnBalanceAsync) was the smell that proved the model was wrong.

## Lessons Learned

- When a "correction" function exists to patch data that the model itself misrepresents, the model is wrong. Fix the model, not the data.
- Single-record-per-entity models are easier to reason about than multi-type ledgers when the business domain has a single pool. YAGNI applies to schema design too.
- Config-driven recalculation as a channel service (called after save, not embedded in the config handler) keeps concerns separated and makes the recalculation testable independently.
- Fallback to most-permissive value (max_annual_leave) when UserRole is missing is safer than failing — users get their days, admin can correct role later.

## Next Steps

- **Cancel-approved-request UsedDays restoration**: known bug, out of scope for this plan. When a previously-approved request is cancelled, UsedDays is not decremented. This will cause incorrect remaining-days display. Needs dedicated plan.
- **UserRole staleness**: currently synced only on GET /me and login. If admin changes a user's role in the IdP, the UserRole row updates only on next /me call. Acceptable for now (<100 users).
- **Negative remaining days display**: frontend should show a warning when remaining < 0 so admin knows to investigate.