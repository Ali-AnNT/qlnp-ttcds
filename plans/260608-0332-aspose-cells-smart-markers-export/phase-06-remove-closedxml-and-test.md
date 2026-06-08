---
phase: 6
title: "Remove ClosedXML and Test"
status: pending
priority: P1
effort: "1h"
dependencies: [1, 4, 5]
---

# Phase 6: Remove ClosedXML and Test

## Overview

Final cleanup: verify no ClosedXML references remain, remove the NuGet package, and test the export endpoint end-to-end. Also verify Aspose.Cells license setup works (or gracefully degrades to eval mode).

## Requirements

- Functional: Export endpoint produces valid .xlsx file with 1 or 4 sheets depending on `period` parameter
- Non-functional: No evaluation watermark when license is provided; graceful eval mode when not

## Architecture

End-to-end test flow:
```
GET /api/reports/export?period=none → 1 sheet "Chi tiết"
GET /api/reports/export?period=month → 4 sheets with grouped data
GET /api/reports/export?status=approved&period=quarter → 4 sheets filtered by status
```

## Related Code Files

- Modify: `packages/api/QLNP.Api.csproj` (ClosedXML removed in Phase 1)
- Verify: All files under `packages/api/Features/Reports/Export/`
- Verify: `packages/api/Program.cs` (license init)
- Verify: `packages/api/Infrastructure/AsposeLicenseSetup.cs`

## Implementation Steps

1. **Search for remaining ClosedXML references**:
   ```bash
   grep -r "ClosedXML" packages/api/
   grep -r "XLWorkbook" packages/api/
   grep -r "IXLWorksheet" packages/api/
   grep -r "IXLRange" packages/api/
   grep -r "XLColor" packages/api/
   ```
   All should return zero results.

2. **Verify Aspose.Cells license setup**:
   - Start the API: `pnpm api:watch`
   - Check console output for `[Aspose] License not set:` message (expected without license file)
   - No exceptions should be thrown

3. **Test export endpoint — no period (detail only)**:
   ```bash
   curl -o test-detail.xlsx "https://localhost:5001/api/reports/export?period=none" \
     -H "Authorization: Bearer <token>"
   ```
   - Open in Excel: should have 1 sheet "Chi tiết"
   - Verify: bold headers, gray background (#F0F0F0), number format on column G
   - Verify: auto-filter on header row
   - Verify: columns auto-fit to content

4. **Test export endpoint — with period (all 4 sheets)**:
   ```bash
   curl -o test-grouped.xlsx "https://localhost:5001/api/reports/export?period=month" \
     -H "Authorization: Bearer <token>"
   ```
   - Open in Excel: should have 4 sheets
   - Verify "Nhân viên - Loại phép" has merged Period cells (group:merge)
   - Verify "Theo phòng ban" has merged Period cells
   - Verify "Tổng hợp" has simple data rows
   - Verify all sheets have auto-filter and auto-fit columns

5. **Test export endpoint — with status filter**:
   ```bash
   curl -o test-filtered.xlsx "https://localhost:5001/api/reports/export?status=approved&period=quarter" \
     -H "Authorization: Bearer <token>"
   ```
   - Verify only approved requests are included

6. **Verify evaluation watermark** (if no license file):
   - Open the .xlsx file
   - Check for "Evaluation Only" watermark on any sheet
   - This is expected behavior until license file is provided

7. **Clean up**: Remove any test files, ensure no test data committed

## Success Criteria

- [ ] Zero ClosedXML references in codebase (`grep -r "ClosedXML" packages/api/` returns nothing)
- [ ] `dotnet build` passes with no warnings about missing packages
- [ ] Export with `period=none` produces 1-sheet .xlsx with correct data
- [ ] Export with `period=month` produces 4-sheet .xlsx with grouped data
- [ ] Export with `status=approved&period=quarter` filters correctly
- [ ] Header rows are bold with gray background
- [ ] Number format `0.0` applied to day-count columns
- [ ] Auto-filter enabled on all sheets
- [ ] Columns auto-fit to content
- [ ] No runtime exceptions in API logs
- [ ] License setup gracefully handles missing license file (eval mode)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Leftover ClosedXML reference causing compile error | Low | Medium | Grep search in Step 1 |
| Smart Markers not processing (appear as text in output) | Medium | High | Verify template is correct embedded resource; check resource name |
| `group:merge` producing unexpected results | Low | Medium | Test with real data; fallback to non-grouped if needed |
| Aspose.Cells 20.11.0 incompatibility with .NET 10 | Low | High | Aspose.Cells targets .NET Standard 2.0; should be compatible |
| Evaluation watermark on output (no license) | Expected | Low | User will provide license later; document expected behavior |

## Next Steps

All phases complete. The module is ready for:
- Adding Aspose.Cells license file when received
- Designer modifying template .xlsx for format changes (no code rebuild needed)
- Adding more report types by creating new templates and data sources