---
phase: 3
title: "Layout"
status: pending
priority: P1
effort: "30m"
dependencies: [1, 2]
---

# Phase 3: Layout

## Overview

Migrate layout feature (AppLayout, AppSidebar, AppHeader, NavLink) into `features/layout/`. Layout depends on auth (for user info in sidebar/header) and departments API (for sidebar nav).

## Requirements

- Functional: Sidebar navigation, header breadcrumbs, user menu all work unchanged
- Non-functional: Layout components import from `features/auth` public API only

## Architecture

```
features/layout/
├── api/
│   └── departments.api.ts   # From src/api/departments.api.ts
├── components/
│   ├── app-layout.tsx       # From src/pages/AppLayout.tsx (34 lines)
│   ├── app-sidebar.tsx      # From src/components/AppSidebar.tsx
│   ├── app-header.tsx       # From src/components/AppHeader.tsx
│   └── nav-link.tsx         # From src/components/NavLink.tsx
└── index.ts
```

## Related Code Files

- Move: `src/pages/AppLayout.tsx` → `features/layout/components/app-layout.tsx`
- Move: `src/components/AppSidebar.tsx` → `features/layout/components/app-sidebar.tsx`
- Move: `src/components/AppHeader.tsx` → `features/layout/components/app-header.tsx`
- Move: `src/components/NavLink.tsx` → `features/layout/components/nav-link.tsx`
- Move: `src/api/departments.api.ts` → `features/layout/api/departments.api.ts`
- Create: `features/layout/index.ts`
- Update: `app/router.tsx` (import AppLayout from features)
- Delete: old files after move

## Implementation Steps

1. Create directory:
   ```bash
   mkdir -p src/features/layout/{api,components}
   ```

2. Move layout components:
   ```bash
   mv src/pages/AppLayout.tsx src/features/layout/components/app-layout.tsx
   mv src/components/AppSidebar.tsx src/features/layout/components/app-sidebar.tsx
   mv src/components/AppHeader.tsx src/features/layout/components/app-header.tsx
   mv src/components/NavLink.tsx src/features/layout/components/nav-link.tsx
   ```

3. Move departments API (used by sidebar for nav):
   ```bash
   mv src/api/departments.api.ts src/features/layout/api/departments.api.ts
   ```

4. Update internal imports within layout components:
   - `@/contexts/AuthContext` → `@/features/auth` (use public API)
   - `@/api/departments.api` → `../api/departments.api`
   - `@/components/ui/*` → `@/shared/ui/*`
   - `@/lib/utils` → `@/shared/lib/utils`
   - `@/lib/leave-data` → `@/features/shared-reference-data`

5. Create barrel export:
   ```typescript
   // features/layout/index.ts
   export { AppLayout } from './components/app-layout';
   export { AppSidebar } from './components/app-sidebar';
   export { AppHeader } from './components/app-header';
   export type { DepartmentDto } from './api/departments.api';
   ```

6. Update `app/router.tsx`:
   ```typescript
   import { AppLayout } from '@/features/layout';
   ```

7. Update any other consumers of departments API to import from `@/features/layout`

8. Delete old files

9. Build and verify: `bun run build`

## Success Criteria

- [ ] Layout feature fully self-contained in `features/layout/`
- [ ] Sidebar renders correctly with user info
- [ ] Header shows breadcrumbs and user menu
- [ ] Navigation links work
- [ ] `bun run build` passes
- [ ] No references to old layout paths

## Risk Assessment

- **Medium risk**: Sidebar imports from many places (auth, departments, UI kit, leave-data). All must update.
- **Departments API**: Currently shared with store. Will need to keep re-exported from layout or move to shared if 3+ features need it. For now, layout owns it — other features import via layout public API.
