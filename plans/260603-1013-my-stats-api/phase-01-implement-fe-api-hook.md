---
phase: 1
title: "Implement FE API + Hook"
status: pending
priority: P2
effort: "30m"
dependencies: []
---

# Phase 1: Implement FE API + Hook

## Overview

Create the frontend API client function for `GET /api/my-stats` and a React Query hook `useMyStats` that dashboard will consume.

## Requirements

- Functional: Call `GET /api/my-stats`, return typed response, auto-unwrap `Result<T>` envelope
- Non-functional: Single network call, cached by React Query, stale-while-revalidate

## Architecture

```
api.get<MyStatsResponse>("/my-stats")
  → unwrapEnvelope → { data: MyStatsResponse, error: null }

useMyStats()
  → queryKey: ["my-stats"]
  → queryFn: myStatsApi.get()
  → returns: { remainingDays, pendingCount, approvedCount, usedDays, loading, error }
```

## Related Code Files

- Create: `packages/web/src/features/dashboard/api/my-stats.api.ts`
- Create: `packages/web/src/features/dashboard/hooks/use-my-stats.ts`
- Read: `packages/web/src/shared/api/client.ts` (existing `api.get` + `unwrapEnvelope`)
- Read: `packages/web/src/features/leave-requests/api/leave-requests.api.ts` (pattern reference)

## Implementation Steps

1. Create `my-stats.api.ts` — API function + TypeScript type matching `MyStatsResponse`:
   ```ts
   import { api } from "@/shared/api/client";

   export interface MyStatsResponse {
     remainingDays: number;
     pendingCount: number;
     approvedCount: number;
     usedDays: number;
   }

   export const myStatsApi = {
     get: () => api.get<MyStatsResponse>("/my-stats"),
   };
   ```

2. Create `use-my-stats.ts` — React Query hook:
   ```ts
   import { useQuery } from "@tanstack/react-query";
   import { myStatsApi, type MyStatsResponse } from "../api/my-stats.api";

   export function useMyStats() {
     const query = useQuery({
       queryKey: ["my-stats"],
       queryFn: async () => {
         const res = await myStatsApi.get();
         return res.data;
       },
     });

     return {
       ...query.data,
       loading: query.isLoading,
       error: query.error,
     };
   }
   ```

## Success Criteria

- [ ] `myStatsApi.get()` calls `GET /api/my-stats` with auth header
- [ ] `useMyStats()` returns typed `{ remainingDays, pendingCount, approvedCount, usedDays }`
- [ ] Query key `["my-stats"]` is unique and stable
- [ ] No compile errors (`bun run build` passes)

## Risk Assessment

Low risk — purely additive (new files), no existing code changed yet.