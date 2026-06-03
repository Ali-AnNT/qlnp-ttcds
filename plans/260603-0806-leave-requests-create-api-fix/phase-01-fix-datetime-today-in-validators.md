---
phase: 1
title: Fix DateTime.Today in validators
status: completed
priority: P1
effort: 30m
dependencies: []
---

# Phase 1: Fix DateTime.Today in validators

## Overview

FluentValidation `RuleFor(x => x.StartDate).GreaterThanOrEqualTo(DateTime.Today)` evaluates `DateTime.Today` once at validator construction time (singleton). If the API runs past midnight, the comparison date becomes stale. Fix: use lambda `_ => DateTime.Today` to evaluate per-request.

## Key Insights

- FastEndpoints registers validators as singletons — `DateTime.Today` is captured at startup, not per-request
- Affects both `CreateLeaveRequestValidator.cs` and `UpdateLeaveRequestValidator.cs`
- Timezone mismatch (server UTC vs Vietnam UTC+7) compounds the issue

## Requirements

- Functional: Validation must use current date at request time, not startup time
- Non-functional: No performance impact (lambda is negligible)

## Related Code Files

- Modify: `packages/api/Features/LeaveRequests/Create/CreateLeaveRequestValidator.cs`
- Modify: `packages/api/Features/LeaveRequests/Update/UpdateLeaveRequestValidator.cs`

## Implementation Steps

1. In `CreateLeaveRequestValidator.cs`, change line 9 from:
   ```csharp
   .GreaterThanOrEqualTo(DateTime.Today)
   ```
   to:
   ```csharp
   .GreaterThanOrEqualTo(_ => DateTime.Today)
   ```

2. In `UpdateLeaveRequestValidator.cs`, apply the same change on line 9.

3. Consider timezone: evaluate whether `DateTime.Today` should use Vietnam timezone (`TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh")`) instead of server local time. For now, use `DateTime.Today` with lambda since the frontend also uses `new Date()` (client local time) — both are Vietnam-local in production.

## Success Criteria

- [x] Both validators use `_ => DateTime.Today` (lambda) instead of `DateTime.Today` (captured value)
- [x] API compiles without errors
- [x] Date validation works correctly when API has been running past midnight
