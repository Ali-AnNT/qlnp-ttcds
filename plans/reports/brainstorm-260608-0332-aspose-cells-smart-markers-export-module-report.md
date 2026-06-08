# Brainstorm Report: Aspose.Cells Smart Markers Export Module

**Date:** 2026-06-08  
**Scope:** Migrate ClosedXML → Aspose.Cells 20.11.0 với Smart Markers (template-based)  
**Status:** Design approved — awaiting plan

---

## 1. Problem Statement & Requirements

Hệ thống QLNP export Excel báo cáo nghỉ phép dùng ClosedXML (code-first approach). Mỗi lần đổi layout/format cần sửa code C# → rebuild → redeploy. Yêu cầu:

- **Thường xuyên đổi format/layout** Excel mà không muốn sửa code
- **Migration sang Aspose.Cells 20.11.0** (đã có license, sẽ bổ sung sau)
- **Tách biệt thiết kế (template) và xử lý (code)** — designer tự chỉnh .xlsx
- **4 sheet**: Chi tiết, Nhân viên - Loại phép, Theo phòng ban, Tổng hợp
- Giữ nguyên behavior hiện tại (filters, date format, number format)

---

## 2. Evaluated Approaches

### A. Direct API (giống ClosedXML hiện tại) ❌ REJECTED
- Đổi ClosedXML API → Aspose.Cells API, giữ nguyên code-first
- **Pros**: Simple, ~50 dòng thay đổi, ít rủi ro
- **Cons**: Format thay đổi → sửa code → rebuild. Không đáp ứng yêu cầu "thường xuyên đổi format"
- **Verdict**: Không đáp ứng requirement chính

### B. Smart Markers (template .xlsx + WorkbookDesigner) ✅ CHOSEN
- Template .xlsx chứa Smart Markers (`&=Details.HoTen`), code chỉ bind data
- **Pros**: Tách biệt hoàn toàn template và code, designer tự sửa .xlsx, format thay đổi = sửa template
- **Cons**: Thêm file template, cần hiểu Smart Marker syntax, phức tạp hơn Direct API
- **Verdict**: Đáp ứng requirement "thường xuyên đổi format" — đây là lý do chính

### C. Hybrid (Direct API + Smart Markers) ❌ REJECTED
- Over-engineering cho use case hiện tại. KISS violation.

---

## 3. Architecture & Design

### 3.1 Data Flow

```
Client → GET /api/reports/export?period=month&status=approved
  ↓
ExportReportEndpoint
  ↓ Query DB → LeaveRequest[]
  ↓ LoadUserInfoBatchAsync → userLookup
  ↓ Build DTOs (DetailRow[], EmployeeLeaveRow[], etc.)
  ↓
ExcelBuilder (Smart Markers)
  ↓ Load embedded template → WorkbookDesigner
  ↓ SetDataSource("Details", detailRows)
  ↓ SetDataSource("EmployeeLeaves", empLeaveRows)  [if period != "none"]
  ↓ SetDataSource("Departments", deptRows)           [if period != "none"]
  ↓ SetDataSource("Summary", summaryRows)            [if period != "none"]
  ↓ Process()
  ↓ Post-process: AutoFilter, AutoFitColumns, remove empty sheets
  ↓
MemoryStream → Send.StreamAsync (.xlsx)
```

### 3.2 Template Smart Markers

**Sheet 1: "Chi tiết"** (luôn có)

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| STT | Họ tên | Phòng ban | Loại phép | Từ ngày | Đến ngày | Số ngày | Trạng thái |
| `&=Details.Stt` | `&=Details.HoTen` | `&=Details.TenDonVi` | `&=Details.LeaveType` | `&=Details.FromDate` | `&=Details.ToDate` | `&=Details.TotalDays` | `&=Details.Status` |

**Sheet 2: "Nhân viên - Loại phép"** (period != "none")

| A | B | C | D |
|---|---|---|---|
| Kỳ | Họ tên | Loại phép | Tổng số ngày |
| `&=EmployeeLeaves.Period(group:merge)` | `&=EmployeeLeaves.HoTen` | `&=EmployeeLeaves.LeaveType` | `&=EmployeeLeaves.TotalDays` |

**Sheet 3: "Theo phòng ban"** (period != "none")

| A | B | C | D |
|---|---|---|---|
| Kỳ | Phòng ban | Số NV nghỉ | Tổng số ngày |
| `&=Departments.Period(group:merge)` | `&=Departments.TenDonVi` | `&=Departments.EmployeeCount` | `&=Departments.TotalDays` |

**Sheet 4: "Tổng hợp"** (period != "none")

| A | B | C |
|---|---|---|
| Kỳ | Tổng số NV nghỉ | Tổng số ngày |
| `&=Summary.Period` | `&=Summary.EmployeeCount` | `&=Summary.TotalDays` |

**Template formatting** (set directly in .xlsx, no code needed):
- Header row: Bold, background #F0F0F0
- Column G (Số ngày): Number format `0.0`
- Column D (Tổng số ngày on sheets 2,3), Column C (sheet 4): Number format `0.0`

### 3.3 Conditional Sheets Handling

Khi `period == "none"`: chỉ giữ sheet "Chi tiết", xóa 3 sheet kia sau Process():

```csharp
if (period == "none") {
    // Remove sheets 2-4 by name (Aspose uses 0-based index)
    wb.Worksheets.RemoveAt("Nhân viên - Loại phép");
    wb.Worksheets.RemoveAt("Theo phòng ban");
    wb.Worksheets.RemoveAt("Tổng hợp");
}
```

### 3.4 File Structure

```
packages/api/
  Features/Reports/Export/
    ExcelBuilder.cs              → REWRITE: WorkbookDesigner + Smart Markers
    ExportReportEndpoint.cs      → MINOR: change workbook handling
    ExportReportRequest.cs       → NO CHANGE
    ExportReportValidator.cs     → NO CHANGE
    StatusLabels.cs              → NO CHANGE
    ExportModels.cs              → NEW: DTO classes for Smart Marker data sources
  Resources/ExcelTemplates/
    BaoCaoNghiPhep.xlsx          → NEW: template with Smart Markers
  Infrastructure/
    AsposeLicenseSetup.cs        → NEW: license init on app startup
```

### 3.5 DTO Models (ExportModels.cs)

```csharp
namespace QLNP.Api.Features.Reports.Export;

// Must have public properties matching Smart Marker names exactly
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

public sealed record EmployeeLeaveRow(
    string Period,
    string HoTen,
    string LeaveType,
    double TotalDays
);

public sealed record DepartmentRow(
    string Period,
    string TenDonVi,
    int EmployeeCount,
    double TotalDays
);

public sealed record SummaryRow(
    string Period,
    int EmployeeCount,
    double TotalDays
);
```

### 3.6 ExcelBuilder.cs Rewrite (Pseudocode)

```csharp
using Aspose.Cells;

namespace QLNP.Api.Features.Reports.Export;

internal static class ExcelBuilder {
    public static Workbook BuildWorkbook(
        List<DetailRow> details,
        List<EmployeeLeaveRow>? employeeLeaves,
        List<DepartmentRow>? departments,
        List<SummaryRow>? summary) {

        // 1. Load template from embedded resource
        var assembly = typeof(ExcelBuilder).Assembly;
        var resourceName = "QLNP.Api.Resources.ExcelTemplates.BaoCaoNghiPhep.xlsx";
        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new FileNotFoundException($"Template not found: {resourceName}");

        // 2. Create WorkbookDesigner
        var designer = new WorkbookDesigner {
            Workbook = new Workbook(stream)
        };

        // 3. Bind data sources
        designer.SetDataSource("Details", details);

        if (employeeLeaves is { Count: > 0 }) {
            designer.SetDataSource("EmployeeLeaves", employeeLeaves);
            designer.SetDataSource("Departments", departments!);
            designer.SetDataSource("Summary", summary!);
        }

        // 4. Process markers
        designer.Process(false);

        // 5. Post-process: conditional sheets, auto-filter, auto-fit
        var wb = designer.Workbook;

        if (employeeLeaves is null or { Count: 0 }) {
            wb.Worksheets.RemoveAt("Nhân viên - Loại phép");
            wb.Worksheets.RemoveAt("Theo phòng ban");
            wb.Worksheets.RemoveAt("Tổng hợp");
        }

        foreach (Worksheet ws in wb.Worksheets) {
            int rowCount = ws.Cells.MaxDataRow + 1;
            int colCount = ws.Cells.MaxDataColumn + 1;
            if (rowCount > 0 && colCount > 0) {
                string endCol = GetColumnName(colCount);
                ws.AutoFilter.Range = $"A1:{endCol}{rowCount}";
            }
            ws.AutoFitColumns();
        }

        return wb;
    }

    private static string GetColumnName(int colCount) { /* ... */ }
}
```

### 3.7 ExportReportEndpoint.cs Changes

```csharp
// BEFORE (ClosedXML)
using var workbook = ExcelBuilder.BuildWorkbook(requests, userLookup, req.Period);
using var stream = new MemoryStream();
workbook.SaveAs(stream);

// AFTER (Aspose.Cells)
var (details, employeeLeaves, departments, summary) = 
    ExportDataMapper.Map(requests, userLookup, req.Period);
using var workbook = ExcelBuilder.BuildWorkbook(details, employeeLeaves, departments, summary);
using var stream = new MemoryStream();
workbook.Save(stream, SaveFormat.Xlsx);
```

### 3.8 License Setup (Program.cs)

```csharp
// Program.cs — add early in builder setup
var license = new Aspose.Cells.License();
license.SetLicense("Aspose.Cells.lic"); // File path or embedded resource name
```

**Note:** License file chưa có. Cần thêm khi nhận được. Tạm thời app sẽ chạy với evaluation watermark.

### 3.9 csproj Changes

```xml
<!-- REMOVE -->
<PackageReference Include="ClosedXML" Version="0.105.0" />

<!-- ADD -->
<PackageReference Include="Aspose.Cells" Version="20.11.0" />

<!-- ADD: Embedded template resource -->
<ItemGroup>
  <EmbeddedResource Include="Resources\ExcelTemplates\*.xlsx" />
</ItemGroup>
```

---

## 4. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Template missing from embedded resources** | API crash 404/500 | `FileNotFoundException` với message rõ ràng, log warning |
| **Smart Marker name mismatch** (template `&=Details.HoTen` vs DTO `HoTen`) | Empty cells, silent failure | Unit test: verify DTO properties match template markers |
| **License not set** | "Evaluation Only" watermark trên output | Log warning at startup, grace period, clear TODO comment |
| **group:merge not working as expected** | Period column not merging | Test với real data, fallback: populate Period manually without grouping |
| **Memory leak (Workbook/Stream not disposed)** | Server memory pressure | Wrap trong `using` blocks, test với load |
| **Aspose.Cells 20.11.0 API differences from latest docs** | Compilation errors | Verify against 20.11.0 release notes, test early |

---

## 5. Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Approach | Smart Markers (template-based) | User needs frequent format changes without code rebuild |
| Template storage | Embedded resource in DLL | Safer, no missing file risk, simpler deployment |
| License | Will provide later | Placeholder in Program.cs, app runs with eval watermark |
| Conditional sheets | One template, remove unused after Process() | KISS — one template to maintain |
| Number format | Set in template .xlsx | No code needed, designer controls formatting |
| Auto-filter | Post-process in code | Cannot be set via Smart Markers |
| AutoFitColumns | Post-process in code | Cannot be set via Smart Markers |
| STT (row number) | Property in DetailRow DTO | Smart Markers doesn't auto-number |

---

## 6. Implementation Sequence

1. **Add Aspose.Cells NuGet** + update csproj (embedded resources)
2. **Create ExportModels.cs** — DTO classes for data sources
3. **Create ExportDataMapper.cs** — maps domain data → DTOs
4. **Create template BaoCaoNghiPhep.xlsx** with Smart Markers
5. **Rewrite ExcelBuilder.cs** — WorkbookDesigner + Smart Markers
6. **Update ExportReportEndpoint.cs** — new data mapping flow
7. **Add AsposeLicenseSetup.cs** — license init (placeholder)
8. **Remove ClosedXML** from csproj
9. **Manual test** — verify all 4 sheets, formatting, filters, period grouping

---

## 7. Unresolved Questions

1. **License file**: Cung cấp khi nào? Cần đặt tên file cụ thể cho `SetLicense()`.
2. **Aspose.Cells 20.11.0 compatibility**: Version này từ Nov 2020. Cần verify Smart Markers API ổn định ở version này (docs hiện tại là 2024+).
3. **Template designer**: Ai sẽ tạo file .xlsx template ban đầu? Dev hoặc designer?
4. **Vietnamese characters in sheet names**: Aspose.Cells 20.11.0 có handle Unicode sheet names correctly không?

---

## 8. References

- [Aspose.Cells Smart Markers Documentation](https://docs.aspose.com/cells/net/smart-markers/)
- [Aspose.Cells Grouping in Smart Markers](https://docs.aspose.com/cells/net/how-to-group-data-in-smart-markers/)
- [Aspose.Cells Nested Objects with Smart Markers](https://docs.aspose.com/cells/net/how-to-import-nested-objects-with-smart-markers/)
- [Aspose.Cells Custom Objects in Smart Markers](https://docs.aspose.com/cells/net/using-anonymous-types-or-custom-objects-in-aspose-cells/)
- [Aspose.Cells Licensing](https://docs.aspose.com/cells/net/licensing/)
- [Aspose.Cells WorkbookDesigner API](https://reference.aspose.com/cells/net/aspose.cells/workbookdesigner/)
- [Research Report](./research-260608-0310-closedxml-to-aspose-cells-migration-report.md)