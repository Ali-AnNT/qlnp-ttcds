---
phase: 12
title: "Cleanup & ESLint Boundaries"
status: pending
priority: P2
effort: "1h"
dependencies: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
---

# Phase 12: Cleanup & ESLint Boundaries

## Overview

Remove all old structure (pages/, api/, components/, contexts/, store/, hooks/, lib/). Configure ESLint boundary rules to enforce VSA conventions going forward. Final verification pass.

## Requirements

- Functional: App compiles and runs identically after cleanup
- Non-functional: ESLint catches VSA violations (deep imports, cross-feature imports)

## Architecture

**Delete these directories after confirming they're empty:**
```
src/pages/         → all moved to features/*/components/
src/api/           → all moved to features/*/api/ or shared/api/
src/components/    → all moved to features/*/components/ or shared/ui/
src/contexts/      → all moved to features/auth/contexts/
src/store/         → all replaced by TanStack Query hooks per feature
src/hooks/         → all moved to shared/hooks/
src/lib/           → all moved to shared/lib/ or shared-reference-data/
```

**ESLint boundary config:**
- Block deep imports into features (must use index.ts)
- Block cross-feature imports (features can only import from shared + shared-reference-data)
- Allow shared to be imported from anywhere
- Allow features to import from other features' public API only when necessary

## Related Code Files

- Delete: `src/store/useStore.ts`
- Delete: `src/contexts/` (empty dir)
- Delete: `src/pages/` (empty dir)
- Delete: `src/api/` (empty dir)
- Delete: `src/hooks/` (empty dir)
- Delete: `src/lib/` (empty dir)
- Delete: `src/components/` (empty dir)
- Create: ESLint boundary config
- Update: `eslint.config.js`

## Implementation Steps

1. Verify all old directories are empty or contain only unused files:
   ```bash
   find src/pages src/api src/components src/contexts src/store src/hooks src/lib -type f
   ```

2. Delete Zustand store (if not already deleted):
   ```bash
   rm src/store/useStore.ts && rmdir src/store
   ```
   **IMPORTANT**: Only delete after confirming ALL 9 consumers have been migrated to TanStack Query hooks in previous phases. Verified consumers: ApprovalPage.tsx, CalendarPage.tsx, ConfigPage.tsx, DashboardPage.tsx, LeaveMyPage.tsx, LeaveNewPage.tsx, ReportsPage.tsx, SummaryPage.tsx, ViolationsPage.tsx. <!-- Updated: Validation Session 1 - 9 useStore consumers confirmed -->

3. Delete empty directories:
   ```bash
   rmdir src/pages src/api src/components src/contexts src/hooks src/lib
   ```
   Remove any leftover unused files found in step 1.

4. Update `src/main.tsx` — ensure it imports from `./app/App` only

5. Verify clean build:
   ```bash
   bun run build
   bun run dev  # manual check in browser
   ```

6. Configure ESLint boundary rules. Use react-vsa skill's `scripts/generate-eslint-config.py`:
   ```bash
   python3 ~/.claude/skills/react-vsa/scripts/generate-eslint-config.py --arch=vsa --enforcement=boundaries
   ```
   Or manually add to `eslint.config.js`:
   ```javascript
   // Block deep imports into features
   'no-restricted-imports': ['error', {
     patterns: ['@/features/*/components/*', '@/features/*/hooks/*', '@/features/*/api/*']
   }]
   ```

7. Run ESLint and fix any violations:
   ```bash
   bun run lint
   ```

8. Run full test suite:
   ```bash
   bun run test
   ```

9. Run VSA verification script:
   ```bash
   python3 ~/.claude/skills/react-vsa/scripts/verify-vsa-architecture.py src/
   ```

10. Update project docs:
    - `docs/system-architecture.md`: Update frontend structure diagram
    - `docs/code-standards.md`: Update import conventions, component structure
    - `README.md`: Update project structure section

## Success Criteria

- [ ] All old directories deleted (pages, api, components, contexts, store, hooks, lib)
- [ ] No Zustand store remaining
- [ ] ESLint boundary rules active and passing
- [ ] `bun run build` passes
- [ ] `bun run test` passes
- [ ] `bun run lint` passes
- [ ] VSA verification script reports no violations
- [ ] Project docs updated to reflect new structure
- [ ] App renders identically in browser

## Risk Assessment

- **Store deletion**: If any consumer was missed in previous phases, deleting useStore will break the build. 9 consumers verified — all page files must be fully migrated first.
- **ESLint config**: Boundary rules may initially flag legitimate cross-feature imports. Review and adjust as needed.
- **Mitigation**: Build after every step. Keep old files until confirmed unused.

## Final Structure

```
packages/web/src/
├── app/
│   ├── App.tsx
│   ├── providers.tsx
│   ├── router.tsx
│   └── main.tsx (moved from src/main.tsx or updated import)
├── features/
│   ├── auth/
│   ├── layout/
│   ├── dashboard/
│   ├── leave-requests/
│   ├── approval/
│   ├── calendar/
│   ├── summary/
│   ├── reports/
│   ├── violations/
│   ├── config/
│   └── shared-reference-data/
├── shared/
│   ├── api/client.ts
│   ├── hooks/use-mobile.tsx, use-toast.tsx
│   ├── lib/utils.ts, date-utils.ts
│   └── ui/ (49 shadcn components)
└── test/
```
