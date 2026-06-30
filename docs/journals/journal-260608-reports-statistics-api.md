# Reports Statistics API — move aggregation to BE

**Date**: 2026-06-08 04:30
**Severity**: Medium
**Component**: Reports — statistics endpoint, FE hook, filter bar
**Status**: Resolved
**Branch**: feat/aspose-cells-smart-markers-export
**Plan**: plans/260608-0430-reports-statistics-api
**Depends on**: 260608-0332-aspose-cells-smart-markers-export

## What Happened

Report statistics compute ở client: 3 API call (requests, departments, leave types) + useMemo aggregate. Chậm, N+1 data transfer, logic nặng FE. Move sang single GET /api/reports/statistics endpoint, BE compute KPI server-side.

## The Brutal Truth

Win rõ: 3 API call → 1. Client không aggregate gì. O(N) calc + batch query BE. Secure file download: Bearer token trong Authorization header thay vì query string.

Bug ăn mừng: client.ts set Content-Type: application/json cho GET request (không body) → ASP.NET Core JSON deserializer throw HTTP 400 "The input does not contain any JSON tokens". Fix: chỉ set Content-Type khi có body. Bug pre-existing, migration plan tình cờ phát hiện.

## Technical Details

BE mới (Features/Reports/Statistics/):
- StatisticsEndpoint.cs — GET /api/reports/statistics
- StatisticsRequest.cs / StatisticsResponse.cs / StatisticsMapper.cs / StatisticsValidator.cs
- WhereIf conditional query filter (status, start date, end date)
- LeaveRequestUserLookup.LoadUserInfoBatchAsync batch user info, group by department
- KPI server-side: total days, approved ratio, status counts, byDept, byType, byPeriod

FE:
- useReportsStatistics hook (TanStack Query)
- reports.api.ts + index.ts rewrite, export statistics endpoint types
- ReportsFilterBar component (status, date range, period select, Excel export)
- ReportsPage rewrite — render từ hook, download file qua authenticated fetch Bearer header
- DEL use-reports-data.ts (old client-side aggregation)
- Fix deep import useSystemConfigs leave-new-page.tsx (pre-existing lint)
- Fix client.ts Content-Type conditional

Export endpoint refactor dùng WhereIf thay raw if blocks (touchpoint). SRP: statistics endpoint (JSON) tách export endpoint (.xlsx).

## What We Tried

1. Single statistics endpoint (JSON) vs export endpoint (.xlsx) tách — CHỌN. SRP, clean API signature.
2. WhereIf conditional query thay raw if blocks — CHỌN. Consistent với project convention.
3. Bearer token header thay query string — CHỌN. Secure.

## Root Cause Analysis

Root cause design cũ: FE aggregate vì "đơn giản ban đầu". 3 call + useMemo OK khi data nhỏ, scale khi report phức tạp → chậm, N+1 transfer. FE không nên là computation engine cho KPI. BE có DB index, batch query, O(N) gần source.

Bug client.ts Content-Type: assumption "JSON client luôn set Content-Type" sai cho GET. ASP.NET Core strict deserializer reject empty body khi Content-Type khai báo JSON.

## Lessons Learned

- Move aggregation BE sớm: 3 call + useMemo FE = debt. Khi report phức tạp, debt lãi. Single endpoint BE = investment.
- SRP tách JSON vs binary export: statistics endpoint trả JSON, export endpoint trả .xlsx. Không nhồi 2 concern vào 1 endpoint.
- WhereIf convention: consistent conditional query building. Raw if blocks lặp = mồi bug quên else.
- GET request không set Content-Type khi no body: ASP.NET Core JSON deserializer reject empty body. Request helper phải conditional.
- Secure download: Bearer header > query string token. Query string log leak.

## Next Steps

- Depends on plan 260608-0332-aspose-cells-smart-markers-export. Verify dependency resolved.
- Monitor: statistics endpoint performance khi data lớn. Batch query user info có thể chậm nếu user count high — index check.
- Reviewer finding M (ExportReportEndpoint WhereIf refactor) resolved.
- Verification: dotnet build 0 warning 0 error, pnpm build success, pnpm test 40/40 pass.
