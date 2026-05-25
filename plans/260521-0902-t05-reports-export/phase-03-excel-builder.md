---
phase: 3
title: "Excel Builder"
status: pending
priority: P1
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: Excel Builder

## Overview

Create `ExcelBuilder.cs` — pure ClosedXML logic. Builds workbook with 1 sheet (raw detail) when `period=none`, or 4 sheets (detail + 3 aggregated) when `period=month|quarter|year`. All formatting: bold header, gray background, auto-width, auto-filter, UTF-8, decimal format.

## Context

- Brainstorm: [brainstorm-report](./brainstorm-report-t05-reports-export.md) → Excel Layout, Formatting, Aggregation strategy, Period calculation
- Models: `StatusLabels.ToVietnamese()` from Phase 1
- Data: `List<LeaveRequest>` with `User.DonVi.TenDonVi` + `LeaveType.Name` from Phase 2

## Related Code Files

- Create: `packages/api/Features/Reports/Export/ExcelBuilder.cs`
- Depends on: `Models.cs` (StatusLabels, Request period), Entities (LeaveRequest, UserMaster, DmDonvi, LeaveType)

## Architecture

```
ExcelBuilder (static class)
├── BuildWorkbook(requests, period) → XLWorkbook
│   ├── AddDetailSheet(workbook, requests)
│   ├── AddEmployeeLeaveTypeSheet(workbook, grouped)  — only when period != none
│   ├── AddDepartmentSheet(workbook, grouped)         — only when period != none
│   └── AddSummarySheet(workbook, grouped)            — only when period != none
├── FormatHeader(ws)         — bold, gray bg, auto-filter
├── AutoWidth(ws)            — adjust column widths
└── GroupByPeriod(requests, period) → IEnumerable<PeriodGroup>
```

## Implementation Steps

1. **Create `ExcelBuilder.cs`**

   Key structure:
   - `internal static class ExcelBuilder` — no DI needed, pure functions
   - Main entry: `public static XLWorkbook BuildWorkbook(List<LeaveRequest> requests, string period)`
   - Calls `AddDetailSheet` always; calls 3 aggregation sheets only when `period != "none"`
   - Aggregation: group raw data in-memory with LINQ `GroupBy`

2. **Detail sheet ("Chi tiết")**

   Columns: STT, Họ tên, Phòng ban, Loại phép, Từ ngày, Đến ngày, Số ngày, Trạng thái

   - STT: 1-indexed row counter
   - Họ tên: `r.User.HoTen` (verify field name on UserMaster)
   - Phòng ban: `r.User.DonVi?.TenDonVi ?? ""`
   - Loại phép: `r.LeaveType.Name`
   - Từ ngày/Đến ngày: `r.StartDate`/`r.EndDate` formatted `dd/MM/yyyy`
   - Số ngày: `r.TotalDays`, number format `0.0`
   - Trạng thái: `StatusLabels.ToVietnamese(r.Status)`

3. **Period grouping logic**

   ```csharp
   private static string GetPeriodKey(DateOnly date, string period) => period switch
   {
       "month"   => $"{date.Year}-{date.Month:D2}",
       "quarter" => $"{date.Year}-Q{(date.Month - 1) / 3 + 1}",
       "year"    => $"{date.Year}",
       _ => throw new ArgumentException($"Invalid period: {period}")
   };
   ```

   Grouping: each LeaveRequest maps to a period key based on `StartDate`. A request spanning multiple periods is attributed to the period of its `StartDate` only (simple, consistent).

4. **Employee×LeaveType×Period sheet ("Nhân viên - Loại phép")**

   Columns: Kỳ, Họ tên, Loại phép, Tổng số ngày

   - Group by: period key × User.HoTen × LeaveType.Name
   - Aggregate: `Sum(r.TotalDays)`
   - Sorted: period key, then employee name

5. **Department×Period sheet ("Theo phòng ban")**

   Columns: Kỳ, Phòng ban, Số NV nghỉ, Tổng số ngày

   - Group by: period key × department name
   - Aggregate: `DistinctCount(r.UserId)` for "Số NV nghỉ", `Sum(r.TotalDays)`
   - Department name: `r.User.DonVi?.TenDonVi ?? ""`

6. **Period summary sheet ("Tổng hợp")**

   Columns: Kỳ, Tổng số NV nghỉ, Tổng số ngày

   - Group by: period key only
   - Aggregate: `DistinctCount(r.UserId)`, `Sum(r.TotalDays)`

7. **Common formatting helper**

   ```csharp
   private static void FormatSheet(IXLWorksheet ws, int rowCount)
   {
       // Header styling
       var headerRow = ws.Row(1);
       headerRow.Style.Font.Bold = true;
       headerRow.Style.Fill.BackgroundColor = XLColor.FromHtml("#F0F0F0");

       // Auto-filter
       ws.Range(1, 1, Math.Max(rowCount, 1), ws.ColumnsUsed().Count())
         .SetAutoFilter();

       // Auto-width
       ws.Columns().AdjustToContents();
   }
   ```

8. **Empty data handling**: all sheets still created with headers only. No rows = valid .xlsx.

## Success Criteria

- [ ] `ExcelBuilder.BuildWorkbook()` returns valid `XLWorkbook`
- [ ] `period=none` → workbook with 1 sheet "Chi tiết"
- [ ] `period=month` → workbook with 4 sheets
- [ ] Detail sheet columns: STT, Họ tên, Phòng ban, Loại phép, Từ ngày, Đến ngày, Số ngày, Trạng thái
- [ ] Vietnamese status labels used in detail sheet
- [ ] Headers: bold, gray background, auto-filter enabled
- [ ] Columns auto-width adjusted
- [ ] Number format `0.0` on all "Số ngày" columns
- [ ] Date format `dd/MM/yyyy` on date columns
- [ ] Empty data → sheets with headers only, no crash
- [ ] `dotnet build` 0 errors