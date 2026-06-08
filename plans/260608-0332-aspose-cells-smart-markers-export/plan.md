---
title: Aspose.Cells Smart Markers Export Module
description: >-
  Migrate from ClosedXML to Aspose.Cells 20.11.0 with template-based Smart
  Markers approach for Excel report generation. Template .xlsx files separate
  design from code, enabling frequent format changes without rebuild.
status: pending
priority: P2
branch: dev
tags:
  - aspose-cells
  - smart-markers
  - excel-export
  - migration
blockedBy: []
blocks: []
created: '2026-06-08T03:42:12.742Z'
createdBy: 'ck:plan'
source: skill
---

# Aspose.Cells Smart Markers Export Module

## Overview

Migrate the Excel export feature from ClosedXML (code-first) to Aspose.Cells 20.11.0 with Smart Markers (template-based). This enables designers to modify report layout/formatting by editing .xlsx templates without code changes or rebuilds.

**Key benefit**: Format changes = edit .xlsx template, not code rebuild.

**Scope**: 2 files rewritten, 2 new files, 1 template file, 1 csproj update. All under `Features/Reports/Export/`.

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Setup NuGet and License](./phase-01-setup-nuget-and-license.md) | Pending | In Progress |
| 2 | [Create DTO Models and Data Mapper](./phase-02-create-dto-models-and-data-mapper.md) | Pending | 1h |
| 3 | [Create Excel Template with Smart Markers](./phase-03-create-excel-template-with-smart-markers.md) | Pending | 1h |
| 4 | [Rewrite ExcelBuilder with WorkbookDesigner](./phase-04-rewrite-excelbuilder-with-workbookdesigner.md) | Pending | 2h |
| 5 | [Update ExportReportEndpoint](./phase-05-update-exportreportendpoint.md) | Pending | 30min |
| 6 | [Remove ClosedXML and Test](./phase-06-remove-closedxml-and-test.md) | Pending | 1h |

## Dependencies

None — this is a standalone feature migration.

## Architecture

```
Client → GET /api/reports/export?period=month&status=approved
  │
  ▼
ExportReportEndpoint
  │ Query DB → LeaveRequest[]
  │ LoadUserInfoBatchAsync → userLookup
  │ ExportDataMapper.Map() → (DetailRow[], EmployeeLeaveRow[]?, DepartmentRow[]?, SummaryRow[]?)
  │
  ▼
ExcelBuilder (Smart Markers)
  │ Load embedded template → WorkbookDesigner
  │ SetDataSource("Details", detailRows)
  │ SetDataSource("EmployeeLeaves", empLeaveRows)  [if period != "none"]
  │ SetDataSource("Departments", deptRows)           [if period != "none"]
  │ SetDataSource("Summary", summaryRows)            [if period != "none"]
  │ Process()
  │ Post-process: AutoFilter, AutoFitColumns, remove empty sheets
  │
  ▼
MemoryStream → Send.StreamAsync (.xlsx)
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Approach | Smart Markers (template-based) | User needs frequent format changes without code rebuild |
| Template storage | Embedded resource in DLL | Safer deployment, no missing file risk |
| License | Placeholder, provide later | License file not yet available |
| Conditional sheets | One template, remove unused after Process() | KISS — single template to maintain |
| Number format & header style | Set in template .xlsx | Designer controls formatting, no code needed |
| AutoFilter & AutoFitColumns | Post-process in code | Not supported by Smart Markers |
| STT (row numbering) | Property in DetailRow DTO | Smart Markers doesn't auto-number |

## Files Impact

| File | Action | Description |
|------|--------|-------------|
| `QLNP.Api.csproj` | MODIFY | Remove ClosedXML, add Aspose.Cells 20.11.0, add embedded resource |
| `Features/Reports/Export/ExportModels.cs` | CREATE | DTO classes for Smart Marker data sources |
| `Features/Reports/Export/ExportDataMapper.cs` | CREATE | Maps domain data → DTOs |
| `Features/Reports/Export/ExcelBuilder.cs` | REWRITE | WorkbookDesigner + Smart Markers |
| `Features/Reports/Export/ExportReportEndpoint.cs` | MODIFY | New data flow with mapper |
| `Features/Reports/Export/ExportReportRequest.cs` | NO CHANGE | — |
| `Features/Reports/Export/ExportReportValidator.cs` | NO CHANGE | — |
| `Features/Reports/Export/StatusLabels.cs` | NO CHANGE | — |
| `Resources/ExcelTemplates/BaoCaoNghiPhep.xlsx` | CREATE | Template with Smart Markers |
| `Infrastructure/AsposeLicenseSetup.cs` | CREATE | License init on app startup |
| `Program.cs` | MODIFY | Add Aspose license init call |

## References

- [Brainstorm Report](../../reports/brainstorm-260608-0332-aspose-cells-smart-markers-export-module-report.md)
- [Research Report](../../reports/research-260608-0310-closedxml-to-aspose-cells-migration-report.md)
