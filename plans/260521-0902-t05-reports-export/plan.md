---
title: "T-05: Reports/Export Endpoint"
description: "GET /api/reports/export — Export leave requests to .xlsx (ClosedXML). Raw detail + month/quarter/year aggregation. GD.PGD only. FR-054, FR-08.4, FR-08.5, FR-08.6, AC-019."
status: completed
priority: P1
branch: "dev"
tags: [dotnet, fastendpoints, closedxml, reports, export]
blockedBy: []
blocks: [T-10-integration-tests]
created: "2026-05-21"
createdBy: "ck:plan"
source: skill
---

# T-05: Reports/Export Endpoint

## Overview

GD.PGD exports leave requests as .xlsx. Raw detail sheet always present. When `period=month|quarter|year`, adds 3 aggregated sheets (Employee×LeaveType×Period, Department×Period, Period summary). Filters: status + date range.

## Brainstorm Source

[brainstorm-report-t05-reports-export.md](./brainstorm-report-t05-reports-export.md) — all locked decisions, API contract, Excel layout.

## Key Decisions

| Item | Decision |
|------|----------|
| Library | ClosedXML (MIT) |
| Role | GD.PGD only |
| Aggregation | In-memory LINQ GroupBy (data volume small) |
| Dept name | `UserMaster.DonVi.TenDonVi` (not DeptCode) |
| Status labels | Vietnamese mapping in ExcelBuilder |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Setup + Models](./phase-01-setup-models.md) | Completed |
| 2 | [Data Layer](./phase-02-data-layer.md) | Completed |
| 3 | [Excel Builder](./phase-03-excel-builder.md) | Completed |
| 4 | [Endpoint + Wiring](./phase-04-endpoint-wiring.md) | Completed |

## Dependencies

- **blocks**: T-10 (integration tests need this endpoint)
- **blockedBy**: none (standalone feature, no FK to audit entity)

## Success Criteria (AC-019)

- [x] GD.PGD → 200 + .xlsx download; other roles → 403
- [x] File opens in Excel/Google Sheets
- [x] Bold header, auto-width, auto-filter, UTF-8 on all sheets
- [x] `period=none` → 1 sheet; `period=month|quarter|year` → 4 sheets
- [x] Vietnamese status labels render correctly
- [x] `dotnet build` 0 errors

## Validation Log

### Session 1 — 2026-05-21
**Trigger:** User requested validation before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Plan uses `HttpContext.Response` directly for file download, but FastEndpoints provides `Send.StreamAsync()` which auto-sets Content-Disposition. Which approach?
   - Options: Send.StreamAsync | HttpContext.Response direct
   - **Answer:** Send.StreamAsync (Recommended)
   - **Rationale:** Uses FastEndpoints-native API, cleaner, auto-sets Content-Disposition header

2. **[Architecture]** A leave request from Jan 28 to Feb 3 spans 2 months. For aggregated sheets, which period does it belong to?
   - Options: Attribute to StartDate period | Split across periods
   - **Answer:** Attribute to StartDate period (Recommended)
   - **Rationale:** Simple, consistent grouping key. Avoids complex date arithmetic for proportional splitting.

3. **[Assumptions]** UserMaster.HoTen and DonVi.TenDonVi are nullable. What should the Excel show when they're null?
   - Options: Empty string | Placeholder text "(Chưa xác định)"
   - **Answer:** Empty string (Recommended)
   - **Rationale:** Clean Excel, no clutter. Placeholder text adds visual noise for edge cases.

#### Confirmed Decisions
- File response: `Send.StreamAsync()` — FastEndpoints-native, replaces raw HttpContext.Response
- Period attribution: StartDate-based — request belongs to period of its StartDate
- Null fields: empty string — `?? ""` for HoTen and TenDonVi

#### Verification Results
- **Tier:** Standard (Fact Checker + Contract Verifier)
- **Claims checked:** 13
- **Verified:** 13 | **Failed:** 0 | **Unverified:** 0
- All file paths, symbols, nav props, field names, FK configs confirmed against live codebase

#### Action Items
- [x] Update Phase 4 Endpoint.cs to use `Send.StreamAsync()` instead of `HttpContext.Response`
- [x] Update Phase 3 Department name to use `""` instead of `"(Chưa xác định)"`
- [x] Remove stale `using Microsoft.AspNetCore.Http` and `AllowAnonymous()` comment from Phase 4

#### Impact on Phases
- Phase 3: Department name null coalesce changed from `"(Chưa xác định)"` to `""`
- Phase 4: Endpoint response method changed from `HttpContext.Response` to `Send.StreamAsync()`

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-setup-models.md, phase-02-data-layer.md, phase-03-excel-builder.md, phase-04-endpoint-wiring.md
- Decision deltas checked: 3
- Reconciled stale references: 3 (Phase 4 response pattern, Phase 3 null coalesce, Phase 4 unused import)
- Unresolved contradictions: 0