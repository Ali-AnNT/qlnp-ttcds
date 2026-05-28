# Brainstorm Report: Simplify LeaveBalance — Single Record Per User Per Year

## Problem Statement

Currently `LeaveBalance` tracks days per leave type per user per year `(UserId, LeaveTypeId, Year)`, with `TotalDays` sourced from role-specific `default_days_{role}` configs. The dashboard "Ngày phép còn lại" sums all remaining days across types. This is confusing and doesn't match the business requirement: display `max_annual_leave - UsedDays` as a single, simple remaining-days metric.

## Requirements (Confirmed)

| # | Requirement | Decision |
|---|-------------|----------|
| 1 | TotalDays source | `max_annual_leave` from SystemConfigs (12) for ALL roles |
| 2 | Balance granularity | 1 record per (UserId, Year) — remove LeaveTypeId from LeaveBalance |
| 3 | RemainingDays formula | `max_annual_leave - UsedDays` |
| 4 | LeaveType on requests | Keep — used for categorization + approval workflow (1/2-level) |
| 5 | Enforcement | Display only, no blocking on request creation |
| 6 | Existing data | Migration: consolidate per-leave-type rows → 1 row, sum UsedDays |
| 7 | default_days_{role} configs | Keep in DB (backward compat), hide from ConfigPage |
| 8 | Cancel approved request | Known bug: UsedDays not restored on cancel — out of scope for this change |

## Architecture Changes

### Current Flow
```
LeaveBalance (UserId, LeaveTypeId, Year)
  TotalDays = default_days_{role} (NPN) or LeaveType.DefaultDays (others)
  UsedDays = per-leave-type used days
  RemainingDays = TotalDays - UsedDays (per type)
Dashboard: remainingDays = sum(RemainingDays across all types)
```

### New Flow
```
LeaveBalance (UserId, Year)  ← ONE record per user per year
  TotalDays = max_annual_leave from SystemConfigs
  UsedDays = total approved days across ALL leave types
  RemainingDays = TotalDays - UsedDays
Dashboard: remainingDays = single balance record
```

## Evaluated Approaches

### A: Frontend-only (rejected)
- Dashboard fetches SystemConfigs, computes `max_annual_leave - UsedDays` on client
- **Pros**: Minimal change, no backend impact
- **Cons**: Inconsistent — other pages still show per-type balances; backend UpsertBalanceAsync still uses LeaveTypeId; TotalDays in DB doesn't match display
- **Why rejected**: User explicitly chose full backend change for consistency

### B: Backend adds maxAnnualLeave field (rejected)
- API returns `maxAnnualLeave` alongside existing per-type balances
- **Pros**: Backward compatible, existing per-type data preserved
- **Cons**: Confusing to have both `TotalDays` (per-role) and `maxAnnualLeave` (global); doesn't match "1 record per user" requirement
- **Why rejected**: User wants single record, not hybrid

### C: Full simplification — single balance record (chosen)
- Remove LeaveTypeId from LeaveBalance, 1 record per (UserId, Year)
- TotalDays = max_annual_leave, UsedDays = sum of all approved days
- **Pros**: Simple, consistent, matches business requirement exactly
- **Cons**: Migration needed, losing per-type breakdown (acceptable per user decision)
- **Why chosen**: Matches confirmed requirements, simplest mental model

## Implementation Plan

### Phase 1: Entity & Migration
- Remove `LeaveTypeId` and `LeaveType` nav property from `LeaveBalance`
- Change unique index from `(UserId, LeaveTypeId, Year)` → `(UserId, Year)`
- Remove `LeaveType` collection from `LeaveBalance` in `AppDbContext`
- Create EF Core migration with data consolidation:
  ```sql
  -- Consolidate: group by (UserId, Year), sum UsedDays
  -- Set TotalDays = 12 (from max_annual_leave config)
  -- Delete old per-type rows
  ```

### Phase 2: Backend Logic Refactor
- **LeaveBalanceDto**: remove `LeaveTypeId`, `LeaveTypeName`
- **Seed/Data.cs**: simplify — create single balance per (UserId, Year) with TotalDays from `max_annual_leave` SystemConfig
- **My/Data.cs**: remove `CorrectNpnBalanceAsync` (no longer needed), simplify query
- **List/Data.cs**: simplify query, remove per-type logic
- **Approve/Data.cs**: `UpsertBalanceAsync` lookup by `(UserId, Year)`, use `max_annual_leave` for TotalDays, remove LeaveTypeId filter
- **AppDbContext**: update `LeaveBalance` configuration, remove LeaveType nav

### Phase 3: Frontend Updates
- **leave-balances.api.ts**: remove `leaveTypeId`, `leaveTypeName` from DTO type
- **DashboardPage.tsx**: use single balance `remainingDays` directly (no reduce across types)
- **ConfigPage.tsx**: hide `default_days_{role}` configs (keep `max_annual_leave`, `min_request_days`, `leave_cycle`)
- **LeaveBalanceCard.tsx**: simplify — no per-type breakdown needed

### Phase 4: Verification
- Build & test: `dotnet build`, `dotnet ef migrations add`, `dotnet ef database update`
- Test approve flow: balance deduction uses max_annual_leave, not per-type
- Test dashboard: remaining days = max_annual_leave - UsedDays
- Test seed: new users get single balance with max_annual_leave TotalDays

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Data loss during migration | Low | Backup DB first; consolidation SQL is additive (sum UsedDays) |
| Cancel-approved-request bug | Existing | Out of scope; noted for future fix |
| Admin view needs per-type breakdown | Medium | LeaveRequest table still has LeaveTypeId; can aggregate on demand |
| max_annual_leave config missing | Low | Seed includes it; add fallback (12) in code |

## Success Criteria
1. Dashboard "Ngày phép còn lại" = `max_annual_leave - UsedDays` (single value)
2. LeaveBalance table has ONE row per (UserId, Year)
3. ConfigPage hides `default_days_{role}`, shows `max_annual_leave`
4. Approval flow correctly deducts UsedDays from single balance
5. Build compiles, no errors