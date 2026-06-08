---
phase: 4
title: "Rewrite ExcelBuilder with WorkbookDesigner"
status: pending
priority: P1
effort: "2h"
dependencies: [2, 3]
---

# Phase 4: Rewrite ExcelBuilder with WorkbookDesigner

## Overview

Rewrite `ExcelBuilder.cs` to use Aspose.Cells `WorkbookDesigner` with Smart Markers instead of ClosedXML. Load template from embedded resource, bind data sources, process markers, and apply post-processing (AutoFilter, AutoFitColumns, conditional sheet removal).

## Requirements

- Functional: Generate same Excel output as current ClosedXML implementation
- Non-functional: Must handle `period == "none"` (only detail sheet) and `period != "none"` (all 4 sheets)
- Template loading from embedded resource with fallback error

## Architecture

```csharp
ExcelBuilder.BuildWorkbook(details, empLeaves, depts, summary)
  │
  ├── Load embedded template BaoCaoNghiPhep.xlsx
  ├── Create WorkbookDesigner(workbook)
  ├── SetDataSource("Details", details)          // always
  ├── SetDataSource("EmployeeLeaves", empLeaves) // if period != "none"
  ├── SetDataSource("Departments", depts)         // if period != "none"
  ├── SetDataSource("Summary", summary)           // if period != "none"
  ├── Process(false)
  ├── Post-process: remove empty sheets if period == "none"
  ├── Post-process: AutoFilter on all sheets
  └── Post-process: AutoFitColumns on all sheets
```

## Related Code Files

- Rewrite: `packages/api/Features/Reports/Export/ExcelBuilder.cs`
- Reference: `packages/api/Features/Reports/Export/ExportModels.cs` (DTOs from Phase 2)
- Reference: `packages/api/Resources/ExcelTemplates/BaoCaoNghiPhep.xlsx` (template from Phase 3)

## Implementation Steps

1. **Replace `using ClosedXML.Excel;` with Aspose.Cells usings**:
   ```csharp
   using Aspose.Cells;
   using System.Reflection;
   ```

2. **Rewrite `BuildWorkbook` signature** — change from domain objects to DTOs:
   ```csharp
   // OLD: public static XLWorkbook BuildWorkbook(
   //     List<LeaveRequest> requests,
   //     Dictionary<long, (string hoTen, string? tenDonVi)> userLookup,
   //     string period)

   // NEW:
   public static Workbook BuildWorkbook(
       List<DetailRow> details,
       List<EmployeeLeaveRow>? employeeLeaves,
       List<DepartmentRow>? departments,
       List<SummaryRow>? summary)
   ```

3. **Implement template loading from embedded resource**:
   ```csharp
   private const string TemplateResourceName = "QLNP.Api.Resources.ExcelTemplates.BaoCaoNghiPhep.xlsx";

   private static Workbook LoadTemplate() {
       var assembly = typeof(ExcelBuilder).Assembly;
       using var stream = assembly.GetManifestResourceStream(TemplateResourceName)
           ?? throw new FileNotFoundException(
               $"Excel template not found: {TemplateResourceName}. " +
               "Available: " + string.Join(", ", assembly.GetManifestResourceNames()));

       return new Workbook(stream);
   }
   ```

4. **Implement WorkbookDesigner data binding**:
   ```csharp
   public static Workbook BuildWorkbook(
       List<DetailRow> details,
       List<EmployeeLeaveRow>? employeeLeaves,
       List<DepartmentRow>? departments,
       List<SummaryRow>? summary) {

       var workbook = LoadTemplate();
       var designer = new WorkbookDesigner { Workbook = workbook };

       // Always bind Details
       designer.SetDataSource("Details", details);

       // Conditionally bind grouped data
       if (employeeLeaves is { Count: > 0 }) {
           designer.SetDataSource("EmployeeLeaves", employeeLeaves);
           designer.SetDataSource("Departments", departments!);
           designer.SetDataSource("Summary", summary!);
       }

       // Process all Smart Markers
       designer.Process(false);

       // Post-process
       var wb = designer.Workbook;
       RemoveEmptySheets(wb, employeeLeaves is null or { Count: 0 });
       ApplyAutoFilterAndFit(wb);

       return wb;
   }
   ```

5. **Implement `RemoveEmptySheets`** — remove grouped sheets when period == "none":
   ```csharp
   private static void RemoveEmptySheets(Workbook wb, bool removeGrouped) {
       if (!removeGrouped) return;

       // Remove by name (Aspose.Cells re-indexes after each remove)
       var sheetsToRemove = new[] { "Nhân viên - Loại phép", "Theo phòng ban", "Tổng hợp" };
       foreach (var name in sheetsToRemove) {
           var idx = wb.Worksheets.GetSheetIndex(name);
           if (idx >= 0) wb.Worksheets.RemoveAt(idx);
       }
   }
   ```

6. **Implement `ApplyAutoFilterAndFit`** — post-process all remaining sheets:
   ```csharp
   private static void ApplyAutoFilterAndFit(Workbook wb) {
       foreach (Worksheet ws in wb.Worksheets) {
           int rowCount = ws.Cells.MaxDataRow + 1;
           int colCount = ws.Cells.MaxDataColumn + 1;

           if (rowCount > 1 && colCount > 0) {
               string endCol = GetColumnName(colCount);
               ws.AutoFilter.Range = $"A1:{endCol}{rowCount}";
           }

           ws.AutoFitColumns();
       }
   }

   private static string GetColumnName(int colCount) {
       var sb = new System.Text.StringBuilder();
       while (colCount > 0) {
           colCount--;
           sb.Insert(0, (char)('A' + colCount % 26));
           colCount /= 26;
       }
       return sb.ToString();
   }
   ```

7. **Delete old code**: Remove `GroupByPeriod`, `GetPeriodKey`, `AddDetailSheet`, `AddEmployeeLeaveTypeSheet`, `AddDepartmentSheet`, `AddSummarySheet`, `FormatSheet` methods. Remove `PeriodGroup` record (moved to ExportDataMapper).

8. **Verify** `dotnet build` passes with no ClosedXML references

## Success Criteria

- [ ] `ExcelBuilder.cs` compiles with only Aspose.Cells references
- [ ] No `using ClosedXML.Excel` in any file
- [ ] `BuildWorkbook` accepts DTOs, not domain objects
- [ ] Template loads from embedded resource
- [ ] Data sources bind correctly
- [ ] Conditional sheet removal works (period == "none" → 1 sheet, otherwise → 4 sheets)
- [ ] AutoFilter and AutoFitColumns applied to all remaining sheets

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `GetManifestResourceStream` returns null | Medium | High | Use `GetManifestResourceNames()` to debug; throw clear exception with available names |
| Smart Markers not processed (stay as text) | Medium | High | Verify marker syntax matches DTO property names exactly; test with small data set |
| `group:merge` produces unexpected grouping | Low | Medium | Test with real data; fallback to non-grouped markers |
| Aspose.Cells 20.11.0 API differences from latest docs | Low | Medium | Test early; verify `WorkbookDesigner.SetDataSource(string, IList<T>)` overload exists in 20.11.0 |

## Next Steps

Proceed to Phase 5 after verifying `dotnet build` passes.