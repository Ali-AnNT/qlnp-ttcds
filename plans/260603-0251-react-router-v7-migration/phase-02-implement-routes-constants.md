---
phase: 2
title: "Implement Routes Constants"
status: pending
priority: P1
effort: "30min"
dependencies: []
---

# Phase 2: Implement Routes Constants

## Overview

Create `app/routes.ts` — single source of truth for all route paths. Export typed `ROUTES` constant used by router, sidebar, header, dashboard, and auth.

## Requirements

- Functional: All route paths defined once, referenced everywhere
- Non-functional: `as const` for type safety, kebab-case keys

## Architecture

```
app/routes.ts  ←  NEW: ROUTES constant
app/router.tsx ←  imports ROUTES
features/layout/components/app-sidebar.tsx ← imports ROUTES
features/layout/components/app-header.tsx  ← imports ROUTES
features/dashboard/components/dashboard-page.tsx ← imports ROUTES
features/auth/hooks/use-auth-guard.tsx ← imports ROUTES
```

## Related Code Files

- Create: `packages/web/src/app/routes.ts`
- Modify (Phase 4): sidebar, header, dashboard, auth-guard — replace hardcoded paths with `ROUTES.*`

## Implementation Steps

1. Create `packages/web/src/app/routes.ts`:
   ```ts
   /**
    * Centralized route path constants.
    * Single source of truth — all navigation must reference these,
    * never hardcode string paths in components.
    */
   export const ROUTES = {
     login: "/login",
     layout: "/quan-ly-nghi-phep",
     dashboard: "/quan-ly-nghi-phep/tong-quan",
     leaveNew: "/quan-ly-nghi-phep/xin-nghi-phep/tao-đon-xin-nghi-phep",
     leaveMy: "/quan-ly-nghi-phep/xin-nghi-phep/danh-sach-đon-cua-toi",
     approval: "/quan-ly-nghi-phep/phe-duyet-đon",
     calendar: "/quan-ly-nghi-phep/theo-doi-lich-nghi-phep",
     summary: "/quan-ly-nghi-phep/tong-hop-lich-nghi-toan-trung-tam",
     reports: "/quan-ly-nghi-phep/thong-ke-bao-cao",
     violations: "/quan-ly-nghi-phep/theo-doi-vuot-muc-quy-đinh",
     config: "/quan-ly-nghi-phep/cau-hinh-quy-đinh-nghi-phep",
   } as const;

   /** Type for route path strings — enables autocomplete */
   export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
   ```

2. Verify ESLint boundaries allow features to import from `@/app/routes`:
   - ESLint config: `app` pattern allows all imports. Features can import `@/app/routes` (not deep feature imports).
   - Actually check: `boundaries/entry-point` rule for `app` target allows all imports → confirmed OK.

3. Verify no existing `routes.ts` file conflicts:
   - Current `router.tsx` defines routes inline → will be replaced in Phase 3.

## Success Criteria

- [ ] `packages/web/src/app/routes.ts` exists with all 11 route paths
- [ ] TypeScript compiles without errors
- [ ] `ROUTES` object is `as const` — type inference works
- [ ] ESLint boundaries allow `@/app/routes` imports from features