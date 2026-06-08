# Research Report: ClosedXML → Aspose.Cells 20.11.0 Migration

## Executive Summary

Migration từ ClosedXML 0.105.0 sang Aspose.Cells 20.11.0 cho tính năng Excel export của QLNP. Phạm vi ảnh hưởng nhỏ: chỉ 2 file (`ExcelBuilder.cs` + `ExportReportEndpoint.cs`) + 1 csproj reference. Aspose.Cells API khác biệt đáng kể so với ClosedXML — đặc biệt indexing (0-based vs 1-based), style model (Style + StyleFlag), và cách đặt giá trị cell (`PutValue` vs `.Value`). License phải được set 1 lần trước khi tạo Workbook.

## Research Methodology
- Sources: 5 (Context7 docs, Aspose official tutorials, web search)
- Date range: 2020–2025
- Key terms: "Aspose.Cells .NET create workbook", "ClosedXML to Aspose.Cells migration", "Aspose.Cells styling number format"

## Key Findings

### 1. API Mapping — ClosedXML → Aspose.Cells

| # | Operation | ClosedXML (current) | Aspose.Cells (target) | Note |
|---|-----------|---------------------|------------------------|------|
| 1 | **Namespace** | `using ClosedXML.Excel;` | `using Aspose.Cells;` + `using System.Drawing;` | — |
| 2 | **Create workbook** | `new XLWorkbook()` | `new Workbook()` | — |
| 3 | **Add worksheet** | `wb.Worksheets.Add("Name")` → `IXLWorksheet` | `wb.Worksheets.Add("Name")` → `int` index, then `wb.Worksheets[i]` | Add() trả về int index, không phải worksheet |
| 4 | **Set cell value** | `ws.Cell(row, col).Value = x` | `ws.Cells[row-1, col-1].PutValue(x)` | ⚠️ Aspose dùng **0-based** index; ClosedXML dùng **1-based** |
| 5 | **Number format** | `ws.Column(n).Style.NumberFormat.Format = "0.0"` | `ws.Cells.Columns[n-1].Style.Custom = "0.0"` rồi apply StyleFlag | Hoặc dùng `Style.Number` cho built-in formats |
| 6 | **Bold header** | `headerRow.Style.Font.Bold = true` | `style.Font.IsBold = true` | — |
| 7 | **Background color** | `XLColor.FromHtml("#F0F0F0")` | `style.ForegroundColor = Color.FromArgb(0xF0, 0xF0, 0xF0); style.Pattern = BackgroundType.Solid` | ⚠️ Phải set `Pattern = BackgroundType.Solid` nếu không màu nền không hiện |
| 8 | **Auto filter** | `ws.Range(1,1,r,c).SetAutoFilter()` | `ws.AutoFilter.Range = "A1:C10"` (string range) | Aspose dùng string range address, không phải row/col indices |
| 9 | **Auto-fit columns** | `ws.Columns().AdjustToContents()` | `ws.AutoFitColumns()` | — |
| 10 | **Save to stream** | `workbook.SaveAs(stream)` | `workbook.Save(stream, SaveFormat.Xlsx)` | — |
| 11 | **Return type** | `XLWorkbook` | `Workbook` | Thay đổi signature method |

### 2. Indexing — Critical Difference

**ClosedXML** dùng **1-based** indexing:
```csharp
ws.Cell(1, 1).Value = "Header"; // Row 1, Column 1
ws.Cell(2, 3).Value = "Data";   // Row 2, Column 3
```

**Aspose.Cells** dùng **0-based** indexing:
```csharp
ws.Cells[0, 0].PutValue("Header"); // Row 1, Column 1
ws.Cells[1, 2].PutValue("Data");   // Row 2, Column 3
```

### 3. Style Model — Most Complex Change

ClosedXML style = direct property assignment:
```csharp
ws.Cell(1, 1).Style.Font.Bold = true;
ws.Cell(1, 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#F0F0F0");
```

Aspose.Cells style = create → configure → apply:
```csharp
// Create reusable style
Style style = workbook.CreateStyle();
style.Font.IsBold = true;
style.ForegroundColor = Color.FromArgb(0xF0, 0xF0, 0xF0);
style.Pattern = BackgroundType.Solid; // REQUIRED!

// Apply to range
StyleFlag flag = new StyleFlag();
flag.Font = true;
flag.CellShading = true;
range.ApplyStyle(style, flag);

// Or apply to single cell/row
cell.SetStyle(style);
```

⚠️ **Pitfall**: Quên `style.Pattern = BackgroundType.Solid` → màu nền không hiện (mặc định là `None`).

### 4. Number Format

ClosedXML:
```csharp
ws.Column(7).Style.NumberFormat.Format = "0.0";
```

Aspose.Cells — 2 cách:
```csharp
// Cách 1: Custom format string
Style style = wb.CreateStyle();
style.Custom = "0.0";
StyleFlag flag = new StyleFlag { CustomNumberFormat = true };
ws.Cells.Columns[6].ApplyStyle(style, flag); // 0-based!

// Cách 2: Apply per-cell trong loop
Style style = cell.GetStyle();
style.Custom = "0.0";
cell.SetStyle(style);
```

### 5. Auto Filter

ClosedXML:
```csharp
ws.Range(1, 1, rowCount, colCount).SetAutoFilter();
```

Aspose.Cells:
```csharp
ws.AutoFilter.Range = $"A1:{GetColumnName(colCount)}{rowCount}";
// Hoặc
ws.AutoFilter.SetRange(0, 0, colCount - 1); // 0-based: startRow, startCol, endCol
```

### 6. License Setup

```csharp
// Gọi 1 lần khi app start (Program.cs hoặc DI)
Aspose.Cells.License license = new Aspose.Cells.License();
license.SetLicense("Aspose.Cells.lic");
// Hoặc từ embedded resource:
// license.SetLicense("Namespace.Aspose.Cells.lic");
```

⚠️ **Phải set license TRƯỚC khi tạo bất kỳ Workbook nào**. Nếu không → watermark "Evaluation Only" trên file xuất.

### 7. Worksheet Access Pattern

ClosedXML `wb.Worksheets.Add("Name")` trả về `IXLWorksheet`.

Aspose.Cells `wb.Worksheets.Add("Name")` trả về **int** (index). Cần lấy worksheet:
```csharp
int idx = wb.Worksheets.Add("Chi tiết");
Worksheet ws = wb.Worksheets[idx];
// Hoặc:
Worksheet ws = wb.Worksheets[wb.Worksheets.Add("Chi tiết")];
```

### 8. Remove Default Sheet

`new Workbook()` tạo sẵn 1 sheet "Sheet1". Cần remove nếu không dùng:
```csharp
wb.Worksheets.RemoveAt(0); // Xóa sheet mặc định
// Hoặc rename:
wb.Worksheets[0].Name = "Chi tiết"; // Tận dụng sheet mặc định
```

## Implementation Recommendations

### Quick Start — Migration Plan

1. **Update `QLNP.Api.csproj`**: Remove ClosedXML, add Aspose.Cells 20.11.0
2. **Add license file** to project (embedded resource hoặc file path)
3. **Set license** trong `Program.cs` khi app start
4. **Rewrite `ExcelBuilder.cs`**: Map từng API theo bảng trên
5. **Update `ExportReportEndpoint.cs`**: Đổi `XLWorkbook` → `Workbook`, đổi `SaveAs(stream)` → `Save(stream, SaveFormat.Xlsx)`

### Code Example — Migrated ExcelBuilder (Core Parts)

```csharp
using Aspose.Cells;
using System.Drawing;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.Reports.Export;

internal static class ExcelBuilder {
    public static Workbook BuildWorkbook(
        List<LeaveRequest> requests,
        Dictionary<long, (string hoTen, string? tenDonVi)> userLookup,
        string period) {
        var wb = new Workbook();
        wb.Worksheets.RemoveAt(0); // Remove default "Sheet1"

        AddDetailSheet(wb, requests, userLookup);

        if (period != "none") {
            var grouped = GroupByPeriod(requests, period);
            AddEmployeeLeaveTypeSheet(wb, grouped, userLookup);
            AddDepartmentSheet(wb, grouped, userLookup);
            AddSummarySheet(wb, grouped);
        }

        return wb;
    }

    private static void AddDetailSheet(Workbook wb, List<LeaveRequest> requests,
        Dictionary<long, (string hoTen, string? tenDonVi)> userLookup) {
        var ws = wb.Worksheets[wb.Worksheets.Add("Chi tiết")];
        var headers = new[] { "STT", "Họ tên", "Phòng ban", "Loại phép",
            "Từ ngày", "Đến ngày", "Số ngày", "Trạng thái" };

        for (int i = 0; i < headers.Length; i++)
            ws.Cells[0, i].PutValue(headers[i]); // 0-based!

        for (int i = 0; i < requests.Count; i++) {
            var r = requests[i];
            var row = i + 1; // 0-based row (row 0 = header)
            var info = userLookup.GetValueOrDefault(r.UserId);
            ws.Cells[row, 0].PutValue(i + 1);
            ws.Cells[row, 1].PutValue(info.hoTen);
            ws.Cells[row, 2].PutValue(info.tenDonVi ?? "");
            ws.Cells[row, 3].PutValue(r.LeaveType?.Name ?? "");
            ws.Cells[row, 4].PutValue(r.StartDate.ToString("dd/MM/yyyy"));
            ws.Cells[row, 5].PutValue(r.EndDate.ToString("dd/MM/yyyy"));
            ws.Cells[row, 6].PutValue(r.TotalDays);
            ws.Cells[row, 7].PutValue(StatusLabels.ToVietnamese(r.Status));
        }

        // Number format on column G (index 6)
        ApplyNumberFormat(wb, ws, 6, "0.0");
        FormatSheet(wb, ws, requests.Count + 1, headers.Length);
    }

    // ... other AddXxxSheet methods follow same pattern

    private static void FormatSheet(Workbook wb, Worksheet ws, int rowCount, int colCount) {
        // Header row style
        Style headerStyle = wb.CreateStyle();
        headerStyle.Font.IsBold = true;
        headerStyle.ForegroundColor = Color.FromArgb(0xF0, 0xF0, 0xF0);
        headerStyle.Pattern = BackgroundType.Solid; // REQUIRED!

        StyleFlag flag = new StyleFlag();
        flag.Font = true;
        flag.CellShading = true;

        var headerRange = ws.Cells.CreateRange(0, 0, 1, colCount);
        headerRange.ApplyStyle(headerStyle, flag);

        // Auto-filter
        if (colCount > 0 && rowCount > 0) {
            string endCol = GetColumnName(colCount);
            ws.AutoFilter.Range = $"A1:{endCol}{rowCount}";
        }

        // Auto-fit columns
        ws.AutoFitColumns();
    }

    private static void ApplyNumberFormat(Workbook wb, Worksheet ws, int colIndex, string format) {
        Style style = wb.CreateStyle();
        style.Custom = format;
        StyleFlag flag = new StyleFlag { CustomNumberFormat = true };
        ws.Cells.Columns[colIndex].ApplyStyle(style, flag);
    }

    // GroupByPeriod and GetPeriodKey unchanged (pure C# logic)

    private static string GetColumnName(int colCount) {
        // Convert column count to Excel column name (1→A, 26→Z, 27→AA, etc.)
        var sb = new System.Text.StringBuilder();
        while (colCount > 0) {
            colCount--;
            sb.Insert(0, (char)('A' + colCount % 26));
            colCount /= 26;
        }
        return sb.ToString();
    }
}
```

### Code Example — Migrated ExportReportEndpoint

```csharp
// In HandleAsync:
using var workbook = ExcelBuilder.BuildWorkbook(requests, userLookup, req.Period);

using var stream = new MemoryStream();
workbook.Save(stream, SaveFormat.Xlsx);
stream.Position = 0;

var fileName = $"bao-cao-nghi-phep-{DateTime.UtcNow:yyyyMMdd}.xlsx";

await Send.StreamAsync(
    stream: stream,
    fileName: fileName,
    fileLengthBytes: stream.Length,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
```

### Code Example — License Setup in Program.cs

```csharp
// Program.cs - thêm early trong WebApplication setup
var license = new Aspose.Cells.License();
license.SetLicense("Aspose.Cells.lic"); // hoặc từ embedded resource
```

### Common Pitfalls

| Pitfall | Description | Fix |
|---------|-------------|-----|
| **0-based vs 1-based indexing** | Aspose.Cells dùng 0-based row/col, ClosedXML dùng 1-based | `ws.Cells[row-1, col-1]` thay vì `ws.Cell(row, col)` |
| **Quên `Pattern = BackgroundType.Solid`** | Màu nền không hiện nếu không set Pattern | Luôn set `style.Pattern = BackgroundType.Solid` khi dùng `ForegroundColor` |
| **Add worksheet trả về int** | ClosedXML trả về IXLWorksheet, Aspose trả về int index | `ws = wb.Worksheets[wb.Worksheets.Add("Name")]` |
| **Default "Sheet1"** | `new Workbook()` tạo sẵn 1 sheet | `wb.Worksheets.RemoveAt(0)` hoặc tận dụng nó |
| **License watermark** | Quên set license → "Evaluation Only" watermark trên output | Set license trong Program.cs trước khi tạo Workbook |
| **StyleFlag bắt buộc** | ApplyStyle cần StyleFlag chỉ định thuộc tính nào được apply | Tạo StyleFlag phù hợp cho từng thao tác |

## Resources & References

- [Aspose.Cells .NET Documentation](https://docs.aspose.com/cells/net/)
- [Aspose.Cells Licensing](https://docs.aspose.com/cells/net/licensing/)
- [Aspose.Cells Save to Stream](https://tutorials.aspose.com/cells/net/workbook-operations/save-excel-stream-aspose-csharp-guide/)
- [Aspose.Cells Auto-Filter](https://docs.aspose.com/cells/net/auto-filter-data-in-vsto-and-aspose-cells/)
- [Aspose.Cells Styling](https://docs.aspose.com/cells/net/how-to-format-a-range)
- [Aspose.Cells Number Format](https://docs.aspose.com/cells/net/how-to-format-number-to-percentage)

## Unresolved Questions

1. **License file location**: User có license file ở đâu? Cần quyết định: embed as resource hay load từ file path?
2. **Version 20.11.0 compatibility**: Aspose.Cells 20.11.0 có thể có API differences so với docs mới nhất (2024+). Cần verify trên version cụ thể.
3. **Default sheet strategy**: Nên remove default "Sheet1" hay rename nó thành sheet đầu tiên? Rename tiết kiệm hơn.