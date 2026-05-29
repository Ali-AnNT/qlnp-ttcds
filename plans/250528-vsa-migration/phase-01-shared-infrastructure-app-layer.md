---
phase: 1
title: "Shared Infrastructure & App Layer"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Shared Infrastructure & App Layer

## Overview

Create `shared/` and `app/` directories. Move generic infrastructure code (UI kit, hooks, utils, API client) to `shared/`. Extract providers and router from `App.tsx` into `app/`. Update all import paths. App must compile and run identically after this phase.

## Requirements

- Functional: All existing features work unchanged after move
- Non-functional: Zero behavioral change, only file locations change

## Architecture

**Before:**
```
src/api/client.ts, src/lib/utils.ts, src/lib/date-utils.ts
src/hooks/use-mobile.tsx, src/hooks/use-toast.ts
src/components/ui/ (49 files)
```

**After:**
```
src/shared/api/client.ts
src/shared/lib/utils.ts, src/shared/lib/date-utils.ts
src/shared/hooks/use-mobile.tsx, src/shared/hooks/use-toast.tsx
src/shared/ui/ (49 files — moved from components/ui/)
src/app/providers.tsx, src/app/router.tsx, src/app/App.tsx
```

## Related Code Files

- Move: `src/api/client.ts` → `src/shared/api/client.ts`
- Move: `src/lib/utils.ts` → `src/shared/lib/utils.ts`
- Move: `src/lib/date-utils.ts` → `src/shared/lib/date-utils.ts`
- Move: `src/hooks/use-mobile.tsx` → `src/shared/hooks/use-mobile.tsx`
- Move: `src/hooks/use-toast.ts` → `src/shared/hooks/use-toast.ts`
- Move: `src/components/ui/*` (49 files) → `src/shared/ui/*`
- Extract: `src/App.tsx` → `src/app/App.tsx` + `src/app/providers.tsx` + `src/app/router.tsx`
- Update: All files importing from moved paths
- Delete: `src/components/ui/` (after move), old `src/App.tsx`
- Create: `src/shared/index.ts` (barrel)

## Implementation Steps

1. Create directory structure:
   ```bash
   mkdir -p src/shared/{api,lib,hooks,ui} src/app
   ```

2. Move API client:
   ```bash
   mv src/api/client.ts src/shared/api/client.ts
   ```

3. Move utilities:
   ```bash
   mv src/lib/utils.ts src/shared/lib/utils.ts
   mv src/lib/date-utils.ts src/shared/lib/date-utils.ts
   ```

4. Move generic hooks:
   ```bash
   mv src/hooks/use-mobile.tsx src/shared/hooks/use-mobile.tsx
   mv src/hooks/use-toast.tsx src/shared/hooks/use-toast.tsx
   ```

5. Move shadcn/ui components:
   ```bash
   mv src/components/ui/* src/shared/ui/
   rmdir src/components/ui
   ```

6. Move `lib/leave-data.ts` to shared reference data + delete dead interfaces:
   ```bash
   mkdir -p src/features/shared-reference-data/constants src/features/shared-reference-data/helpers
   mv src/lib/leave-data.ts src/features/shared-reference-data/constants/app-roles.ts
   # Split: extract approval status helpers to helpers/approval-status.ts
   ```
   Note: `leave-data.ts` contains role constants (AppRoles, roleLabels) and status helpers + **5 dead interfaces** (Department, Employee, LeaveType, LeaveRequest, ApprovalConfig — zero importers, Supabase-era remnant). **Delete the 5 dead interfaces** during the split. Keep only: AppRoles, UserRole, roleLabels, LeaveStatus, leaveStatusLabels, getApprovalStatusLabel, getApprovalStatusColor. Split into `app-roles.ts` (constants) and `approval-status.ts` (helpers). Create `index.ts` barrel.

7. Extract `providers.tsx` from `App.tsx`:
   ```typescript
   // src/app/providers.tsx
   // Move QueryClientProvider, TooltipProvider, Toaster, Sonner, AuthProvider here
   ```

8. Extract `router.tsx` from `App.tsx`:
   ```typescript
   // src/app/router.tsx
   // Move BrowserRouter, Routes, Route definitions here
   // Import pages from current locations (will update in later phases)
   ```

9. Rewrite `App.tsx` as thin wrapper:
   ```typescript
   // src/app/App.tsx
   import { Providers } from './providers';
   import { AppRouter } from './router';
   export default function App() {
     return <Providers><AppRouter /></Providers>;
   }
   ```

10. Update `main.tsx` to import from `app/App`:
    ```typescript
    import App from './app/App';
    ```

11. Update ALL import paths across codebase:
    - `@/api/client` → `@/shared/api/client`
    - `@/lib/utils` → `@/shared/lib/utils`
    - `@/lib/date-utils` → `@/shared/lib/date-utils`
    - `@/hooks/use-mobile` → `@/shared/hooks/use-mobile`
    - `@/hooks/use-toast` → `@/shared/hooks/use-toast`
    - `@/components/ui/*` → `@/shared/ui/*`
    - `@/lib/leave-data` → `@/features/shared-reference-data`

12. Run build: `bun run build` — must pass with zero errors

13. Run dev server: `bun run dev` — app must render identically

## Success Criteria

- [x] All shared code moved to `src/shared/`
- [x] `src/app/providers.tsx`, `src/app/router.tsx`, `src/app/App.tsx` extracted
- [x] `src/main.tsx` updated to import from `app/App`
- [x] All imports updated — zero references to old paths
- [x] `bun run build` passes
- [x] App renders identically in browser
- [x] No orphaned empty directories

## Risk Assessment

- **Import churn**: ~40+ files need path updates. Use IDE find-replace carefully.
- **Leave-data split**: Splitting role constants from status helpers + deleting 5 dead interfaces. Verify zero importers before deleting.
- **Validation**: Confirmed dead interfaces (Department, Employee, LeaveType, LeaveRequest, ApprovalConfig) have zero importers. Safe to delete. <!-- Updated: Validation Session 1 - delete dead interfaces -->
- **Mitigation**: Build after every step. Fix errors immediately.

## Next Steps

Phase 2 (Auth) depends on this phase completing first — auth needs `shared/api/client` and `shared-reference-data`.
