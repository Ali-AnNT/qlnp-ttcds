---
title: Reports Statistics API — move logic and aggregation to BE
date: 2026-06-08
branch: feat/aspose-cells-smart-markers-export
plan: plans/260608-0430-reports-statistics-api/plan.md
---

## What changed

- **BE:**
  - Added new `GET /api/reports/statistics` endpoint under `Features/Reports/Statistics/` (`StatisticsRequest.cs`, `StatisticsResponse.cs`, `StatisticsMapper.cs`, `StatisticsValidator.cs`, `StatisticsEndpoint.cs`).
  - Utilizes `WhereIf` conditional query building to filter by status, start date, and end date.
  - Batches user information loading using `LeaveRequestUserLookup.LoadUserInfoBatchAsync` to group by department name.
  - Computes KPIs (total days, approved ratio, status counts) and lists (`byDept`, `byType`, `byPeriod`) server-side.
  - Refactored existing `ExportReportEndpoint.cs` query filtering to use project-mandated `WhereIf` extension methods instead of raw `if` blocks.
- **FE:**
  - Rewrote `reports.api.ts` and `index.ts` to export new `statistics` endpoint definitions and types.
  - Created `useReportsStatistics` hook using TanStack Query.
  - Created `ReportsFilterBar` component to handle status, date range, period select and trigger Excel export.
  - Refactored `ReportsPage` component to render directly from the new hook and trigger file download via an authenticated `fetch` request passing the Bearer token.
  - Deleted obsolete `use-reports-data.ts` hook.
  - Fixed deep import of `useSystemConfigs` in `leave-new-page.tsx` to resolve a pre-existing restricted import lint error.
  - Modified frontend request helper `client.ts` to conditionally set `Content-Type: application/json` only when `options.body` is present. This prevents ASP.NET Core JSON deserializer from throwing HTTP 400 validation errors ("The input does not contain any JSON tokens") on GET requests.

## Wins

- **Performance Improvement:** Client aggregates no data; O(N) calculations and batch queries are processed on the database/server side.
- **Single Network Request:** Loading the page requires 1 API call instead of 3 (requests, departments, leave types).
- **Secure File Download:** Bearer token is sent in the `Authorization` header instead of passing it insecurely in query string or URL.
- **Improved Code Quality & Reliability:** Enforced `WhereIf` linq extensions everywhere in reports endpoints, fixed the empty GET request validation crash in request client, and resolved pre-existing linting issue.

## Trade-offs accepted

- None.

## Reviewer findings (all resolved)

- **M (resolved):** Refactored touchpoint `ExportReportEndpoint.cs` to use `WhereIf` for conditional filters.

## Verification

- **BE:** `dotnet build` → 0 warnings, 0 errors
- **FE:** `pnpm build` → success
- **FE:** `pnpm lint` → 0 errors, 14 warnings (pre-existing)
- **FE:** `pnpm test --run` → 40/40 tests passed

## Files

```
NEW  packages/api/Features/Reports/Statistics/StatisticsRequest.cs
NEW  packages/api/Features/Reports/Statistics/StatisticsResponse.cs
NEW  packages/api/Features/Reports/Statistics/StatisticsMapper.cs
NEW  packages/api/Features/Reports/Statistics/StatisticsValidator.cs
NEW  packages/api/Features/Reports/Statistics/StatisticsEndpoint.cs
MOD  packages/api/Features/Reports/Export/ExportReportEndpoint.cs
NEW  packages/web/src/features/reports/hooks/use-reports-statistics.ts
NEW  packages/web/src/features/reports/components/reports-filter-bar.tsx
MOD  packages/web/src/features/reports/components/reports-page.tsx
MOD  packages/web/src/features/reports/api/reports.api.ts
MOD  packages/web/src/features/reports/index.ts
DEL  packages/web/src/features/reports/hooks/use-reports-data.ts
MOD  packages/web/src/features/leave-requests/components/leave-new-page.tsx
MOD  packages/web/src/shared/api/client.ts
```
