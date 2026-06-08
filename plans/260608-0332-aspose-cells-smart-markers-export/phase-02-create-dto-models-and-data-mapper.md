---
phase: 2
title: "Create DTO Models and Data Mapper"
status: pending
priority: P1
effort: "1h"
dependencies: [1]
---

# Phase 2: Create DTO Models and Data Mapper

## Overview

Create DTO classes that map domain data to Smart Marker-compatible shapes, and a mapper that converts `LeaveRequest` + user lookup into these DTOs. Property names must match Smart Marker names in template exactly.

## Requirements

- Functional: DTOs with public properties matching Smart Marker syntax (`&=Details.Stt`, `&=Details.HoTen`, etc.)
- Non-functional: Mapper must reuse existing `GroupByPeriod` and `GetPeriodKey` logic from current ExcelBuilder

## Architecture

```
LeaveRequest[] + userLookup
       │
       ▼
ExportDataMapper.Map()
       │
       ├── DetailRow[]          → SetDataSource("Details", ...)
       ├── EmployeeLeaveRow[]   → SetDataSource("EmployeeLeaves", ...)  [if period != "none"]
       ├── DepartmentRow[]       → SetDataSource("Departments", ...)      [if period != "none"]
       └── SummaryRow[]          → SetDataSource("Summary", ...)         [if period != "none"]
```

## Related Code Files

- Create: `packages/api/Features/Reports/Export/ExportModels.cs`
- Create: `packages/api/Features/Reports/Export/ExportDataMapper.cs`
- Reference: `packages/api/Features/Reports/Export/ExcelBuilder.cs` (existing logic to migrate)
- Reference: `packages/api/Features/LeaveRequests/LeaveRequestUserLookup.cs` (user info lookup)
- Reference: `packages/api/Features/Reports/Export/StatusLabels.cs` (status label mapping)

## Implementation Steps

1. **Create `ExportModels.cs`** with 4 record types:

   ```csharp
   namespace QLNP.Api.Features.Reports.Export;

   /// <summary>Row for "Chi tiết" sheet. Property names must match Smart Markers exactly.</summary>
   public sealed record DetailRow(
       int Stt,
       string HoTen,
       string TenDonVi,
       string LeaveType,
       string FromDate,
       string ToDate,
       double TotalDays,
       string Status
   );

   /// <summary>Row for "Nhân viên - Loại phép" sheet.</summary>
   public sealed record EmployeeLeaveRow(
       string Period,
       string HoTen,
       string LeaveType,
       double TotalDays
   );

   /// <summary>Row for "Theo phòng ban" sheet.</summary>
   public sealed record DepartmentRow(
       string Period,
       string TenDonVi,
       int EmployeeCount,
       double TotalDays
   );

   /// <summary>Row for "Tổng hợp" sheet.</summary>
   public sealed record SummaryRow(
       string Period,
       int EmployeeCount,
       double TotalDays
   );
   ```

2. **Create `ExportDataMapper.cs`** — migrate existing grouping logic from `ExcelBuilder.cs`:

   ```csharp
   using QLNP.Api.Shared.Domain;

   namespace QLNP.Api.Features.Reports.Export;

   internal static class ExportDataMapper {
       public static List<DetailRow> MapDetails(
           List<LeaveRequest> requests,
           Dictionary<long, (string hoTen, string? tenDonVi)> userLookup) {
           return requests.Select((r, i) => {
               var info = userLookup.GetValueOrDefault(r.UserId);
               return new DetailRow(
                   Stt: i + 1,
                   HoTen: info.hoTen,
                   TenDonVi: info.tenDonVi ?? "",
                   LeaveType: r.LeaveType?.Name ?? "",
                   FromDate: r.StartDate.ToString("dd/MM/yyyy"),
                   ToDate: r.EndDate.ToString("dd/MM/yyyy"),
                   TotalDays: r.TotalDays,
                   Status: StatusLabels.ToVietnamese(r.Status)
               );
           }).ToList();
       }

       public static (List<EmployeeLeaveRow>? empLeaves, List<DepartmentRow>? depts, List<SummaryRow>? summary)
           MapGrouped(List<LeaveRequest> requests, string period,
               Dictionary<long, (string hoTen, string? tenDonVi)> userLookup) {
           if (period == "none") return (null, null, null);

           var groups = GroupByPeriod(requests, period);

           var empLeaves = groups
               .SelectMany(g => g.Items.GroupBy(it => new {
                   HoTen = userLookup.GetValueOrDefault(it.UserId).hoTen,
                   LeaveType = it.LeaveType?.Name ?? ""
               }).Select(ig => new EmployeeLeaveRow(
                   Period: g.Key,
                   HoTen: ig.Key.HoTen,
                   LeaveType: ig.Key.LeaveType,
                   TotalDays: ig.Sum(x => x.TotalDays)
               )))
               .OrderBy(x => x.Period).ThenBy(x => x.HoTen)
               .ToList();

           var depts = groups
               .SelectMany(g => g.Items.GroupBy(it => userLookup.GetValueOrDefault(it.UserId).tenDonVi ?? "")
                   .Select(dg => new DepartmentRow(
                       Period: g.Key,
                       TenDonVi: dg.Key,
                       EmployeeCount: dg.Select(x => x.UserId).Distinct().Count(),
                       TotalDays: dg.Sum(x => x.TotalDays)
                   )))
               .OrderBy(x => x.Period).ThenBy(x => x.TenDonVi)
               .ToList();

           var summary = groups
               .Select(g => new SummaryRow(
                   Period: g.Key,
                   EmployeeCount: g.Items.Select(x => x.UserId).Distinct().Count(),
                   TotalDays: g.Items.Sum(x => x.TotalDays)
               ))
               .OrderBy(x => x.Period)
               .ToList();

           return (empLeaves, depts, summary);
       }

       private static List<PeriodGroup> GroupByPeriod(List<LeaveRequest> requests, string period)
           => requests.GroupBy(r => GetPeriodKey(r.StartDate, period))
               .Select(g => new PeriodGroup(g.Key, g.ToList()))
               .OrderBy(g => g.Key)
               .ToList();

       private static string GetPeriodKey(DateTime date, string period) => period switch {
           "month" => $"{date.Year}-{date.Month:D2}",
           "quarter" => $"{date.Year}-Q{(date.Month - 1) / 3 + 1}",
           "year" => $"{date.Year}",
           _ => throw new ArgumentException($"Invalid period: {period}")
       };
   }

   internal sealed record PeriodGroup(string Key, List<LeaveRequest> Items);
   ```

3. **Verify** property names match Smart Marker syntax:
   - `&=Details.Stt` ↔ `DetailRow.Stt` ✓
   - `&=Details.HoTen` ↔ `DetailRow.HoTen` ✓
   - `&=EmployeeLeaves.Period(group:merge)` ↔ `EmployeeLeaveRow.Period` ✓
   - All other properties must match exactly (case-sensitive)

## Success Criteria

- [ ] `ExportModels.cs` compiles with all 4 record types
- [ ] `ExportDataMapper.cs` compiles with MapDetails and MapGrouped methods
- [ ] `PeriodGroup` record moved from ExcelBuilder to ExportDataMapper (or shared)
- [ ] Property names exactly match Smart Marker syntax in template

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Property name mismatch with Smart Markers | Medium | High | Compile-time check not possible; manual verification against template |
| `PeriodGroup` duplication | Low | Low | Move from ExcelBuilder to ExportDataMapper, mark old location for removal |

## Next Steps

Proceed to Phase 3 after verifying DTOs compile.