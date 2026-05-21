---
title: Brainstorm Report — T-05 Reports/Export
date: 2026-05-21
status: approved
task: T-05
scope: reports-export + aggregation (FR-054, FR-08.4, FR-08.5, FR-08.6)
---

# T-05: Reports/Export — Design Summary

## Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-08.4 | Export .xlsx: họ tên, phòng ban, loại phép, ngày, số ngày, trạng thái. Bold header, auto-width, auto-filter, UTF-8 | P0 |
| FR-054 | Báo cáo theo tháng/quý — aggregate theo kỳ | P1 |
| FR-08.5 | Lọc theo trạng thái đơn | P1 |
| FR-08.6 | Period selector (month, quarter, year), aggregate theo kỳ | P1 |
| AC-019 | File .xlsx mở được trong Excel, bold header, auto-width, auto-filter, UTF-8 | — |
| BR-008 | Thay thế CSV export bằng Excel .xlsx | Medium |

## Locked Decisions

| Item | Decision | Rationale |
|------|----------|-----------|
| Endpoint | `GET /api/reports/export` | BRD Appendix B spec |
| Role | `GD.PGD` only | BRD §2.2 spec |
| Library | ClosedXML (MIT) | tasks.md decision #6, MIT license, full styling support |
| Scope | Raw export + month/quarter/year aggregation | User approved inclusion of FR-08.6 |
| API surface | Single endpoint, `period` param | `period=none` (default) → raw; `period=month|quarter|year` → aggregated |
| Filters | `status` + `from`/`to` query params | Covers FR-08.5 + natural date filtering |
| Aggregated sheets | Include raw detail as 1st sheet | UX: one download = full picture for directors |

## API Contract

### Request

```
GET /api/reports/export?status=approved_director&from=2026-01-01&to=2026-05-31&period=month
```

| Param | Type | Required | Values | Default |
|-------|------|----------|--------|---------|
| `status` | string | No | `pending`, `approved_leader`, `approved_director`, `rejected`, `cancelled` | All statuses |
| `from` | date | No | ISO 8601 (`2026-01-01`) | No lower bound |
| `to` | date | No | ISO 8601 (`2026-05-31`) | No upper bound |
| `period` | string | No | `none`, `month`, `quarter`, `year` | `none` |

### Response

- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition**: `attachment; filename="bao-cao-nghi-phep-{yyyyMMdd}.xlsx"`
- **Body**: .xlsx binary

### Error Responses

| Case | Status | Body |
|------|--------|------|
| Non-GD.PGD role | 403 | Standard error |
| Invalid `period` value | 400 | Validation error |
| No data found | 200 | Empty Excel with headers only |

## Excel Layout

### Mode: `period=none` (raw detail)

**1 sheet: "Chi tiết"**

| STT | Họ tên | Phòng ban | Loại phép | Từ ngày | Đến ngày | Số ngày | Trạng thái |
|-----|--------|-----------|-----------|---------|----------|---------|------------|

### Mode: `period=month|quarter|year` (4 sheets)

**Sheet 1: "Chi tiết"** — same as raw detail above

**Sheet 2: "Nhân viên - Loại phép"**

| Kỳ | Họ tên | Loại phép | Tổng số ngày |
|----|--------|-----------|-------------|

- Kỳ format: `2026-05` (month), `2026-Q1` (quarter), `2026` (year)
- One row per employee × leave type × period

**Sheet 3: "Theo phòng ban"**

| Kỳ | Phòng ban | Số NV nghỉ | Tổng số ngày |
|----|-----------|-----------|-------------|

- One row per department × period
- "Số NV nghỉ" = distinct employees who took leave in that period

**Sheet 4: "Tổng hợp"**

| Kỳ | Tổng số NV nghỉ | Tổng số ngày |
|----|----------------|-------------|

- One row per period
- Company-wide summary

## Formatting (all sheets)

- Header row: **bold**, light gray background (#F0F0F0)
- Auto-width columns
- Auto-filter on header row
- UTF-8 encoding (ClosedXML default)
- Number format for "Số ngày": `0.0` (1 decimal)

## Implementation Structure

```
packages/api/Features/Reports/Export/
├── Endpoint.cs      # Route, auth, HandleAsync → build Excel → send file
├── Data.cs          # AppDbContext query for LeaveRequests with includes
├── Models.cs        # Request record + Validator
└── ExcelBuilder.cs  # Pure ClosedXML logic: create workbook, sheets, formatting
```

### Files to modify

| File | Change |
|------|--------|
| `packages/api/QLNP.Api.csproj` | Add `<PackageReference Include="ClosedXML" Version="0.104.2" />` |
| `packages/api/Program.cs` | Add `builder.Services.AddScoped<ExportData>();` |

### Data class

```csharp
internal sealed class Data(AppDbContext db)
{
    public async Task<List<LeaveRequest>> GetLeaveRequestsAsync(
        string? status, DateOnly? from, DateOnly? to, CancellationToken ct)
    {
        var q = db.LeaveRequests
            .Include(r => r.User)
                .ThenInclude(u => u.DonVi)  // DmDonvi via DonViId
            .Include(r => r.LeaveType)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            q = q.Where(r => r.Status == status);
        if (from.HasValue)
            q = q.Where(r => r.StartDate >= from.Value);
        if (to.HasValue)
            q = q.Where(r => r.EndDate <= to.Value);

        return await q.OrderBy(r => r.StartDate).ToListAsync(ct);
    }
}
```

### Aggregation strategy

- Fetch raw data once from DB
- Group in-memory with LINQ `.GroupBy()` for 3 aggregated sheets
- Rationale: data volume is small (hundreds of rows max); avoids complex SQL GROUP BY with multiple dimensions; single DB round trip

### Period calculation

```
month:  group by { Year, Month } → format "yyyy-MM"
quarter: group by { Year, Quarter = (Month-1)/3+1 } → format "yyyy-Qn"
year: group by { Year } → format "yyyy"
```

## Key Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| ClosedXML version incompatibility with .NET 10 | Low | Use latest stable; ClosedXML targets netstandard2.0, compatible |
| Large dataset causes memory pressure | Low | LeaveRequest volume small (hundreds); add `from`/`to` filter to limit |
| Department name resolution | Medium | `UserMaster.DeptCode` → join `DmDonvi` for department name; need Include/join |
| Vietnamese characters garbled | Low | ClosedXML defaults to UTF-8; verify with test |

## Resolved Questions

1. **Department name**: Show department display name (e.g. "Phòng CNTT"), not raw DeptCode. Need to Include `User.DeptCode → DmDonvi` join in Data query.
2. **Status display**: Vietnamese labels in Excel — map `approved_director` → "Đã duyệt GĐ", `pending` → "Chờ duyệt", `approved_leader` → "Đã duyệt LĐ", `rejected` → "Từ chối", `cancelled` → "Đã hủy". Director-facing UX.

## Success Criteria (AC-019)

- [ ] `GET /api/reports/export` returns .xlsx with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- [ ] GD.PGD → 200 + file; CB.PCM/LD.PCM → 403
- [ ] File opens in Excel/Google Sheets without errors
- [ ] Bold header, auto-width columns, auto-filter on all sheets
- [ ] UTF-8 Vietnamese characters render correctly
- [ ] `period=none` → 1 sheet with all matching requests
- [ ] `period=month|quarter|year` → 4 sheets (detail + 3 aggregated)
- [ ] Status + date range filters work
- [ ] Empty result → valid .xlsx with headers only