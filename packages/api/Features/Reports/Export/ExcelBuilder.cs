using System;
using System.Collections.Generic;
using System.IO;
using Aspose.Cells;

namespace QLNP.Api.Features.Reports.Export;

internal static class ExcelBuilder {
    private const string TemplateResourceName = "QLNP.Api.Resources.ExcelTemplates.BaoCaoNghiPhep.xlsx";

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

    private static Workbook LoadTemplate() {
        var assembly = typeof(ExcelBuilder).Assembly;
        using var stream = assembly.GetManifestResourceStream(TemplateResourceName)
            ?? throw new FileNotFoundException(
                $"Excel template not found: {TemplateResourceName}. " +
                "Available: " + string.Join(", ", assembly.GetManifestResourceNames()));

        return new Workbook(stream);
    }

    private static void RemoveEmptySheets(Workbook wb, bool removeGrouped) {
        if (!removeGrouped) return;

        // Remove by name (Aspose.Cells re-indexes after each remove)
        var sheetsToRemove = new[] { "Nhân viên - Loại phép", "Theo phòng ban", "Tổng hợp" };
        foreach (var name in sheetsToRemove) {
            var ws = wb.Worksheets[name];
            if (ws != null) {
                wb.Worksheets.RemoveAt(ws.Index);
            }
        }
    }

    private static void ApplyAutoFilterAndFit(Workbook wb) {
        foreach (Worksheet ws in wb.Worksheets) {
            int rowCount = ws.Cells.MaxDataRow + 1;
            int colCount = ws.Cells.MaxDataColumn + 1;

            if (rowCount > 1 && colCount > 0) {
                string endCol = GetColumnName(colCount);
                ws.AutoFilter.Range = $"A1:{endCol}{rowCount}";
            }

            try {
                ws.AutoFitColumns();
            } catch (Exception ex) {
                // AutoFitColumns requires gdiplus/libgdiplus on Linux which may be missing in Docker/Linux environments
                Console.WriteLine($"[ExcelBuilder] AutoFitColumns failed on {ws.Name}: {ex.Message}");
            }
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
}
