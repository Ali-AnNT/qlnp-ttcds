---
phase: 3
title: "Create Excel Template with Smart Markers"
status: pending
priority: P1
effort: "1h"
dependencies: [2]
---

# Phase 3: Create Excel Template with Smart Markers

## Overview

Create the `.xlsx` template file containing Smart Markers for all 4 report sheets. The template is stored as an embedded resource and loaded by WorkbookDesigner at runtime.

## Requirements

- Functional: Template with 4 sheets, each containing Smart Markers matching DTO property names
- Non-functional: Template must be a valid .xlsx file with formatting applied directly (no code needed for styling)

## Architecture

Template structure (4 sheets):

### Sheet 1: "Chi tiết" (always present)

| | A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|---|
| **1** | STT | Họ tên | Phòng ban | Loại phép | Từ ngày | Đến ngày | Số ngày | Trạng thái |
| **2** | `&=Details.Stt` | `&=Details.HoTen` | `&=Details.TenDonVi` | `&=Details.LeaveType` | `&=Details.FromDate` | `&=Details.ToDate` | `&=Details.TotalDays` | `&=Details.Status` |

- Row 1: Bold, background #F0F0F0
- Column G: Number format `0.0`

### Sheet 2: "Nhân viên - Loại phép" (conditional)

| | A | B | C | D |
|---|---|---|---|---|
| **1** | Kỳ | Họ tên | Loại phép | Tổng số ngày |
| **2** | `&=EmployeeLeaves.Period(group:merge)` | `&=EmployeeLeaves.HoTen` | `&=EmployeeLeaves.LeaveType` | `&=EmployeeLeaves.TotalDays` |

- Row 1: Bold, background #F0F0F0
- Column D: Number format `0.0`

### Sheet 3: "Theo phòng ban" (conditional)

| | A | B | C | D |
|---|---|---|---|---|
| **1** | Kỳ | Phòng ban | Số NV nghỉ | Tổng số ngày |
| **2** | `&=Departments.Period(group:merge)` | `&=Departments.TenDonVi` | `&=Departments.EmployeeCount` | `&=Departments.TotalDays` |

- Row 1: Bold, background #F0F0F0
- Column D: Number format `0.0`

### Sheet 4: "Tổng hợp" (conditional)

| | A | B | C |
|---|---|---|---|
| **1** | Kỳ | Tổng số NV nghỉ | Tổng số ngày |
| **2** | `&=Summary.Period` | `&=Summary.EmployeeCount` | `&=Summary.TotalDays` |

- Row 1: Bold, background #F0F0F0
- Column C: Number format `0.0`

## Related Code Files

- Create: `packages/api/Resources/ExcelTemplates/BaoCaoNghiPhep.xlsx`
- Reference: `ExportModels.cs` (property names must match exactly)

## Implementation Steps

1. **Create the template manually using Excel or programmatically**:

   Since Smart Markers require a real .xlsx file with specific markers, create it programmatically using Aspose.Cells API to ensure correctness:

   ```csharp
   // One-time utility script to generate the template
   var wb = new Workbook();
   wb.Worksheets.RemoveAt(0); // Remove default "Sheet1"

   // Sheet 1: Chi tiết
   int idx1 = wb.Worksheets.Add("Chi tiết");
   var ws1 = wb.Worksheets[idx1];
   // Headers
   ws1.Cells[0, 0].PutValue("STT");
   ws1.Cells[0, 1].PutValue("Họ tên");
   ws1.Cells[0, 2].PutValue("Phòng ban");
   ws1.Cells[0, 3].PutValue("Loại phép");
   ws1.Cells[0, 4].PutValue("Từ ngày");
   ws1.Cells[0, 5].PutValue("Đến ngày");
   ws1.Cells[0, 6].PutValue("Số ngày");
   ws1.Cells[0, 7].PutValue("Trạng thái");
   // Smart Markers (row 2)
   ws1.Cells[1, 0].PutValue("&=Details.Stt");
   ws1.Cells[1, 1].PutValue("&=Details.HoTen");
   ws1.Cells[1, 2].PutValue("&=Details.TenDonVi");
   ws1.Cells[1, 3].PutValue("&=Details.LeaveType");
   ws1.Cells[1, 4].PutValue("&=Details.FromDate");
   ws1.Cells[1, 5].PutValue("&=Details.ToDate");
   ws1.Cells[1, 6].PutValue("&=Details.TotalDays");
   ws1.Cells[1, 7].PutValue("&=Details.Status");
   // Header styling
   Style headerStyle = wb.CreateStyle();
   headerStyle.Font.IsBold = true;
   headerStyle.ForegroundColor = Color.FromArgb(0xF0, 0xF0, 0xF0);
   headerStyle.Pattern = BackgroundType.Solid;
   StyleFlag flag = new StyleFlag { Font = true, CellShading = true };
   ws1.Cells.CreateRange(0, 0, 1, 8).ApplyStyle(headerStyle, flag);
   // Number format on column G (index 6)
   Style numStyle = wb.CreateStyle();
   numStyle.Custom = "0.0";
   StyleFlag numFlag = new StyleFlag { CustomNumberFormat = true };
   ws1.Cells.Columns[6].ApplyStyle(numStyle, numFlag);
   ws1.AutoFitColumns();

   // Sheet 2: Nhân viên - Loại phép
   // (similar pattern with &=EmployeeLeaves.* markers and group:merge)
   // Sheet 3: Theo phòng ban
   // (similar pattern with &=Departments.* markers)
   // Sheet 4: Tổng hợp
   // (similar pattern with &=Summary.* markers)

   wb.Save("BaoCaoNghiPhep.xlsx");
   ```

2. **Save template** to `packages/api/Resources/ExcelTemplates/BaoCaoNghiPhep.xlsx`

3. **Verify embedded resource naming**: After building, verify the resource name is `QLNP.Api.Resources.ExcelTemplates.BaoCaoNghiPhep.xlsx` using:
   ```csharp
   typeof(ExcelBuilder).Assembly.GetManifestResourceNames()
   ```

4. **Alternative**: Create template manually in Excel by typing the Smart Marker strings into cells, applying formatting, and saving. This is how designers will edit it in the future.

## Success Criteria

- [ ] Template file contains all 4 sheets with correct Smart Markers
- [ ] Smart Marker property names match `ExportModels.cs` DTO properties exactly
- [ ] Header rows are bold with #F0F0F0 background
- [ ] Number format `0.0` applied to day-count columns
- [ ] Template loads successfully via `Assembly.GetManifestResourceStream()`
- [ ] Resource name verified in build output

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Embedded resource name mismatch | Medium | High | Use `GetManifestResourceNames()` to verify; default naming replaces `/` and `\\` with `.` |
| Smart Marker syntax errors in template | Medium | High | Test with small data set; markers that don't match stay as text |
| Template corrupted by manual editing | Low | High | Keep a backup; version control the template binary |
| `group:merge` not working correctly in 20.11.0 | Low | Medium | Test with grouped data; fallback: populate Period without grouping |

## Next Steps

Proceed to Phase 4 after verifying template loads and resource name is correct.