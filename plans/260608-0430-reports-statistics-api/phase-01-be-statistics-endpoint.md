---
phase: 1
title: "BE: Statistics Endpoint"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: BE: Statistics Endpoint

## Overview

Create `GET /api/reports/statistics` endpoint that computes report statistics server-side, replacing client-side aggregation. Returns JSON with totalDays, approvedRatio, status counts, byDept, byType, and optional byPeriod groupings.

## Requirements

- Functional:
  - Accept query params: `from` (DateOnly?), `to` (DateOnly?), `status` (string?), `period` (none/month/quarter/year)
  - Return `Result<StatisticsResponse>` envelope (consistent with all other endpoints)
  - Compute totalDays (approved only), approvedRatio, status counts (pending, approved, rejected, cancelled)
  - Group by department → `byDept[]` (approved days per department)
  - Group by leave type → `byType[]` (approved days per type)
  - Group by period (when period != "none") → `byPeriod[]`
  - Require Director role (same as export endpoint)
- Non-functional:
  - Reuse `LeaveRequestUserLookup.LoadUserInfoBatchAsync` for user/dept names
  - Reuse period grouping logic from `ExportDataMapper.GetPeriodKey`
  - Single DB query with EF Core filtering

## Architecture

```
GET /api/reports/statistics?from=2026-01-01&to=2026-06-30&status=approved&period=month
  │
  ▼
StatisticsEndpoint.HandleAsync()
  │ 1. Validate request (StatisticsValidator)
  │ 2. Query LeaveRequests with EF filters (status, from, to)
  │ 3. LoadUserInfoBatchAsync → userLookup
  │ 4. StatisticsMapper.Compute() → StatisticsResponse
  │ 5. Send.OkAsync(Result<StatisticsResponse>.Ok(response))
```

## Related Code Files

- Create: `Features/Reports/Statistics/StatisticsRequest.cs`
- Create: `Features/Reports/Statistics/StatisticsResponse.cs`
- Create: `Features/Reports/Statistics/StatisticsMapper.cs`
- Create: `Features/Reports/Statistics/StatisticsValidator.cs`
- Create: `Features/Reports/Statistics/StatisticsEndpoint.cs`
- Reference: `Features/Reports/Export/ExportReportEndpoint.cs` (pattern to follow)
- Reference: `Features/Reports/Export/ExportDataMapper.cs` (period grouping logic)
- Reference: `Features/Reports/Export/ExportReportValidator.cs` (validation rules)
- Reference: `Features/Reports/Export/ExportReportRequest.cs` (request pattern)
- Reference: `Features/MyStats/MyStatsEndpoint.cs` (aggregation pattern)
- Reference: `Features/LeaveRequests/LeaveRequestUserLookup.cs` (user info batch loading)
- Reference: `Shared/Contracts/Result.cs` (response envelope)

## Implementation Steps

1. **Create `StatisticsRequest.cs`** — Same params as ExportReportRequest: `Status`, `From`, `To`, `Period`
   ```csharp
   namespace QLNP.Api.Features.Reports.Statistics;
   
   internal sealed record Request {
       public string? Status { get; init; }
       public DateOnly? From { get; init; }
       public DateOnly? To { get; init; }
       public string Period { get; init; } = "none";
   }
   ```

2. **Create `StatisticsResponse.cs`** — DTOs for response shape
   ```csharp
   namespace QLNP.Api.Features.Reports.Statistics;
   
   public sealed record StatisticsResponse(
       decimal TotalDays,
       int ApprovedRatio,
       int RejectedCount,
       int PendingCount,
       int CancelledCount,
       List<DeptStat> ByDept,
       List<TypeStat> ByType,
       List<PeriodStat>? ByPeriod
   );
   
   public sealed record DeptStat(string Name, decimal Days);
   public sealed record TypeStat(string Name, decimal Value);
   public sealed record PeriodStat(string Period, decimal TotalDays, int EmployeeCount);
   ```

3. **Create `StatisticsMapper.cs`** — Core computation logic
   - Reuse `GetPeriodKey` logic from `ExportDataMapper` (extract or duplicate — small method)
   - Compute totalDays from approved requests only
   - Compute approvedRatio = approved / total * 100 (0 if total is 0)
   - Count by status
   - Group by department using userLookup
   - Group by leave type
   - Group by period (when period != "none")

4. **Create `StatisticsValidator.cs`** — Same validation rules as ExportReportValidator
   ```csharp
   // Reuse exact same rules: valid statuses, valid periods, to >= from
   ```

5. **Create `StatisticsEndpoint.cs`** — FastEndpoints endpoint
   ```csharp
   internal sealed class StatisticsEndpoint : Endpoint<Request, Result<StatisticsResponse>> {
       public AppDbContext Db { get; set; } = null!;
       
       public override void Configure() {
           Get("/api/reports/statistics");
           Roles(AppRoles.Director);
           Tags("Reports");
       }
       
       public override async Task HandleAsync(Request req, CancellationToken ct) {
           // 1. Query with EF filters
           // 2. LoadUserInfoBatchAsync
           // 3. StatisticsMapper.Compute
           // 4. Send.OkAsync
       }
   }
   ```

6. **Build & verify** — Run `dotnet build` to confirm no compile errors

## Success Criteria

- [x] `GET /api/reports/statistics` returns correct JSON envelope with `Result<StatisticsResponse>`
- [x] Filter params (status, from, to, period) work correctly
- [x] totalDays computed from approved requests only
- [x] approvedRatio is percentage (0-100), handles zero division
- [x] byDept groups by department name with approved days
- [x] byType groups by leave type name with approved days
- [x] byPeriod returned only when period != "none"
- [x] Director role required (403 for non-Director)
- [x] Validation rejects invalid status/period values
- [x] Builds without errors

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Large dataset performance | Server-side EF filters (from/to/status) limit query scope |
| Mapper logic inconsistency with export | Reuse GetPeriodKey pattern; similar grouping logic |
| Missing user info for deleted users | Handle null userLookup gracefully (empty name) |