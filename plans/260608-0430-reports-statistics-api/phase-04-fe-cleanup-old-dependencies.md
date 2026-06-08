---
phase: 4
title: "FE: Cleanup Old Dependencies"
status: completed
priority: P3
effort: "30min"
dependencies: [3]
---

# Phase 4: FE: Cleanup Old Dependencies

## Overview

Remove old files and imports that are no longer needed after the reports page refactor. The reports feature no longer depends on leave-requests, layout, or config feature APIs.

## Requirements

- Functional:
  - Delete `use-reports-data.ts` (replaced by `use-reports-statistics.ts`)
  - Remove re-export imports from `reports.api.ts` (leaveRequestsApi, departmentsApi, leaveTypesApi)
  - Verify no other files import from the old reports API re-exports
  - Ensure build passes cleanly after removal
- Non-functional:
  - No dead code left in the reports feature module
  - No dangling imports referencing deleted files

## Architecture

**Before:**
```
reports/
├── api/reports.api.ts          (re-exports from 3 other features)
├── hooks/use-reports-data.ts    (3 API calls + client computation)
├── hooks/use-reports-statistics.ts  (NEW)
└── components/
    ├── reports-page.tsx         (imports useReportsData)
    ├── dept-bar-chart.tsx
    └── type-pie-chart.tsx
```

**After:**
```
reports/
├── api/reports.api.ts          (own types + statistics + exportUrl)
├── hooks/use-reports-statistics.ts  (1 API call)
└── components/
    ├── reports-page.tsx         (imports useReportsStatistics)
    ├── reports-filter-bar.tsx   (NEW)
    ├── dept-bar-chart.tsx
    └── type-pie-chart.tsx
```

## Related Code Files

- Delete: `packages/web/src/features/reports/hooks/use-reports-data.ts`
- Modify: `packages/web/src/features/reports/index.ts` (remove old exports, add new)
- Verify: No imports of old reports API re-exports elsewhere in codebase

## Implementation Steps

1. **Delete `use-reports-data.ts`** — No longer needed; replaced by `use-reports-statistics.ts`

2. **Update `reports.api.ts`** — Already rewritten in Phase 2; verify no old re-exports remain

3. **Update `index.ts`** — Remove `useReportsData` export if present, ensure `useReportsStatistics` is exported

4. **Search for dangling imports** — Grep for any imports of old reports API re-exports:
   ```bash
   grep -rn "from.*reports.*leaveRequestsApi\|from.*reports.*departmentsApi\|from.*reports.*leaveTypesApi"
   ```

5. **Build & verify** — Run `pnpm build` to confirm no compile errors or unused imports

6. **Run lint check** — Ensure no lint warnings related to removed code

## Success Criteria

- [x] `use-reports-data.ts` deleted
- [x] No imports of `leaveRequestsApi`, `departmentsApi`, `leaveTypesApi` from reports module anywhere
- [x] `reports.api.ts` contains only own types, `statistics()`, and `exportUrl()`
- [x] `index.ts` exports `useReportsStatistics` and types only
- [x] `pnpm build` passes with zero errors
- [x] No TypeScript errors in reports feature
- [x] Reports page still works end-to-end (statistics load, filter, export)

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Dangling import in another feature | Grep whole codebase for old imports before deletion |
| Circular dependency if another feature re-exported from reports | Verify re-exports were only used within reports feature itself |