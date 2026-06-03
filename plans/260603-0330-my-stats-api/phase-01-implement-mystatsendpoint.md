---
phase: 1
title: "Implement MyStatsEndpoint"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Implement MyStatsEndpoint

## Overview

Create `GET /api/my-stats` endpoint returning 4 aggregated stats for the authenticated user. FastEndpoints vertical slice following existing conventions.

## Requirements

- **Functional**: Return `remainingDays`, `pendingCount`, `approvedCount`, `usedDays` for current user, current year
- **Non-functional**: Single endpoint, 2 DB queries max, auto-seed balance if missing

## Architecture

```
GET /api/my-stats
  → MyStatsEndpoint (FastEndpoints REPR pattern)
    → EnsureBalancesAsync (reuse existing seeding)
    → Query 1: SUM(TotalDays), SUM(UsedDays) FROM LeaveBalances WHERE UserId=@me AND Year=@currentYear
    → Query 2: SELECT Status, COUNT(*) FROM LeaveRequests WHERE UserId=@me GROUP BY Status
    → Map to MyStatsResponse
```

## Related Code Files

- **Create**: `packages/api/Features/MyStats/MyStatsEndpoint.cs`
- **Create**: `packages/api/Features/MyStats/MyStatsResponse.cs`
- **Create**: `packages/api/Shared/Groups/MyStatsGroup.cs`

**Reference (read-only)**:
- `packages/api/Features/LeaveBalances/My/MyLeaveBalanceEndpoint.cs` — pattern to follow
- `packages/api/Shared/Domain/LeaveBalanceSeeding.cs` — reuse `EnsureBalancesAsync`
- `packages/api/Shared/Contracts/Result.cs` — `Result<T>` wrapper
- `packages/api/Infrastructure/Auth/ICurrentUserProvider.cs` — auth provider
- `packages/api/Shared/Groups/LeaveBalanceGroup.cs` — group pattern
- `packages/api/Shared/Domain/LeaveBalance.cs` — entity model
- `packages/api/Shared/Domain/LeaveRequest.cs` — entity model
- `packages/api/Data/AppDbContext.cs` — DbContext for DbSet access

## Implementation Steps

1. **Create `MyStatsGroup.cs`** in `Shared/Groups/`
   ```csharp
   public class MyStatsGroup : Group {
       public MyStatsGroup() {
           Configure("api/my-stats", ep => {
               ep.Description(x => x.WithTags("My Stats"));
           });
       }
   }
   ```

2. **Create `MyStatsResponse.cs`** in `Features/MyStats/`
   ```csharp
   public sealed record MyStatsResponse(
       decimal RemainingDays,
       int PendingCount,
       int ApprovedCount,
       decimal UsedDays
   );
   ```

3. **Create `MyStatsEndpoint.cs`** in `Features/MyStats/`
   - Inject `AppDbContext Db` and `ICurrentUserProvider CurrentUser`
   - `Configure()`: `Get("/")`, `Group<MyStatsGroup>()`, `Options(x => x.RequireAuthorization())`
   - `HandleAsync()`:
     a. Get current user via `CurrentUser.GetCurrentUser()`
     b. Get current year: `DateTime.UtcNow.Year`
     c. Get primary role: `user.Roles.FirstOrDefault()`
     d. Auto-seed balance: `await LeaveBalanceSeeding.EnsureBalancesAsync(Db, user.UserId, year, ct, primaryRole)`
     e. Query balance aggregates:
        ```csharp
        var balanceAgg = await Db.LeaveBalances
            .Where(b => b.UserId == user.UserId && b.Year == year)
            .GroupBy(_ => 1)
            .Select(g => new {
                TotalDays = g.Sum(b => b.TotalDays),
                UsedDays = g.Sum(b => b.UsedDays)
            })
            .FirstOrDefaultAsync(ct);
        ```
     f. Query request counts by status:
        ```csharp
        var statusCounts = await Db.LeaveRequests
            .Where(lr => lr.UserId == user.UserId)
            .GroupBy(lr => lr.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, ct);
        ```
     g. Build response:
        ```csharp
        var remainingDays = (balanceAgg?.TotalDays ?? 0) - (balanceAgg?.UsedDays ?? 0);
        var usedDays = balanceAgg?.UsedDays ?? 0;
        var pendingCount = statusCounts.GetValueOrDefault("pending");
        var approvedCount = statusCounts.GetValueOrDefault("approved");
        ```
     h. Return: `await Send.OkAsync(Result<MyStatsResponse>.Ok(response), ct)`

4. **Verify compilation** — run `dotnet build packages/api/QLNP.Api.csproj`

## Success Criteria

- [ ] `MyStatsGroup.cs` created with prefix `api/my-stats`
- [ ] `MyStatsResponse.cs` created with 4 fields: RemainingDays, PendingCount, ApprovedCount, UsedDays
- [ ] `MyStatsEndpoint.cs` follows FastEndpoints REPR pattern matching `MyLeaveBalanceEndpoint`
- [ ] Auto-seeds balance row for current year (reuses `LeaveBalanceSeeding.EnsureBalancesAsync`)
- [ ] 2 DB queries only (balance aggregate + request status counts)
- [ ] Uses `ICurrentUserProvider` for auth (same as all other endpoints)
- [ ] Project compiles without errors

## Risk Assessment

- **Low risk**: New endpoint, no existing code modified. Purely additive.
- **Edge case**: User with no balance rows — handled by auto-seed + null-safe aggregates.
- **Edge case**: User with no leave requests — `statusCounts` dict returns 0 via `GetValueOrDefault`.

## Security Considerations

- Endpoint requires authorization (`RequireAuthorization()`)
- Data scoped to `user.UserId` from JWT — no cross-user data leakage
- No input parameters — no injection risk