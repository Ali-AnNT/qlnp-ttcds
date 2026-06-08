---
phase: 2
title: "FE: API Layer and Hook"
status: completed
priority: P2
effort: "30min"
dependencies: [1]
---

# Phase 2: FE: API Layer and Hook

## Overview

Create the frontend API client and TanStack Query hook for the new statistics endpoint. This is the bridge between BE statistics API and the reports page UI.

## Requirements

- Functional:
  - `reportsApi.statistics(qs)` calls `GET /api/reports/statistics?{qs}`
  - `reportsApi.exportUrl(qs)` returns URL for `GET /api/reports/export?{qs}` (direct download)
  - `useReportsStatistics(params)` hook with TanStack Query, queryKey includes params for auto-refetch
  - TypeScript types matching `StatisticsResponse` DTOs from BE
- Non-functional:
  - Follow existing patterns in `shared/api/client.ts` (api.get with Result envelope unwrapping)
  - Follow existing hook pattern from `useLeaveTypes`, `useLeaveBalances`

## Architecture

```
reports.api.ts                  use-reports-statistics.ts
┌──────────────────┐            ┌─────────────────────────┐
│ reportsApi       │            │ useReportsStatistics()   │
│  .statistics(qs) │◄──────────│  queryKey: ["reports-    │
│  .exportUrl(qs)  │            │    statistics", params]  │
│                  │            │  queryFn → api.statistics│
│ api.get<T>(path) │            │  returns: data, isLoading│
└──────────────────┘            └─────────────────────────┘
```

## Related Code Files

- Create: `packages/web/src/features/reports/api/reports.api.ts` (rewrite)
- Create: `packages/web/src/features/reports/hooks/use-reports-statistics.ts` (new)
- Reference: `packages/web/src/shared/api/client.ts` (api.get pattern)
- Reference: `packages/web/src/features/config/hooks/use-leave-types.ts` (hook pattern)
- Reference: `packages/web/src/features/my-stats/` (similar stats hook pattern)

## Implementation Steps

1. **Create TypeScript types** in `reports.api.ts`:
   ```typescript
   export interface StatisticsResponse {
     totalDays: number;
     approvedRatio: number;
     rejectedCount: number;
     pendingCount: number;
     cancelledCount: number;
     byDept: DeptStat[];
     byType: TypeStat[];
     byPeriod: PeriodStat[] | null;
   }
   
   export interface DeptStat {
     name: string;
     days: number;
   }
   
   export interface TypeStat {
     name: string;
     value: number;
   }
   
   export interface PeriodStat {
     period: string;
     totalDays: number;
     employeeCount: number;
   }
   
   export interface ReportsFilterParams {
     from?: string;
     to?: string;
     status?: string;
     period?: string;
   }
   ```

2. **Create `reportsApi`** with `statistics()` and `exportUrl()`:
   ```typescript
   import { api } from "@/shared/api/client";
   import type { StatisticsResponse, ReportsFilterParams } from "./types";
   
   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8003/api";
   
   export const reportsApi = {
     statistics: (params: ReportsFilterParams) => {
       const qs = new URLSearchParams(
         Object.entries(params).filter(([_, v]) => v != null && v !== "") as [string, string][]
       ).toString();
       return api.get<StatisticsResponse>(`/reports/statistics?${qs}`);
     },
     exportUrl: (params: ReportsFilterParams) => {
       const qs = new URLSearchParams(
         Object.entries(params).filter(([_, v]) => v != null && v !== "") as [string, string][]
       ).toString();
       return `${API_URL}/reports/export?${qs}`;
     },
   };
   ```

3. **Create `useReportsStatistics` hook**:
   ```typescript
   import { useQuery } from "@tanstack/react-query";
   import { reportsApi } from "../api/reports.api";
   import type { ReportsFilterParams } from "../api/reports.api";
   
   export function useReportsStatistics(params: ReportsFilterParams = {}) {
     return useQuery({
       queryKey: ["reports-statistics", params],
       queryFn: async () => {
         const { data, error } = await reportsApi.statistics(params);
         if (error) throw error;
         return data!;
       },
     });
   }
   ```

4. **Update `index.ts`** to export new hook:
   ```typescript
   export { default as ReportsPage } from "./components/reports-page";
   export { useReportsStatistics } from "./hooks/use-reports-statistics";
   export type { StatisticsResponse, ReportsFilterParams } from "./api/reports.api";
   ```

## Success Criteria

- [x] `reportsApi.statistics()` calls correct BE endpoint with query params
- [x] `reportsApi.exportUrl()` returns correct URL with auth token consideration
- [x] `useReportsStatistics()` returns data matching `StatisticsResponse` type
- [x] queryKey includes params for proper cache invalidation on filter change
- [x] TypeScript compiles without errors
- [x] Filter params with null/empty values are excluded from query string

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Token auth for export URL | exportUrl returns full URL; browser navigation includes cookies or use fetch+download with auth header |
| Type mismatch with BE response | Types match StatisticsResponse DTOs exactly; verify in integration |