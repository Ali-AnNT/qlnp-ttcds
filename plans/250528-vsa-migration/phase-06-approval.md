---
phase: 6
title: "Approval"
status: pending
priority: P1
effort: "45m"
dependencies: [1, 2, 5]
---

# Phase 6: Approval

## Overview

Migrate approval feature (ApprovalPage) into `features/approval/`. Approval depends on leave-requests for types (LeaveRequestDto). Leaders and Directors approve/reject pending requests.

## Requirements

- Functional: Approve/reject leave requests works. N-level approval flow intact.
- Non-functional: Uses TanStack Query for data fetching. Imports LeaveRequestDto from leave-requests feature.

## Architecture

```
features/approval/
├── components/
│   ├── approval-page.tsx      # From src/pages/ApprovalPage.tsx (200 lines)
│   ├── approval-table.tsx     # Extracted from ApprovalPage
│   ├── reject-dialog.tsx      # Extracted from ApprovalPage
│   └── detail-dialog.tsx      # Extracted from ApprovalPage
├── hooks/
│   ├── use-approval-requests.ts  # TanStack Query for pending requests
│   └── use-approval-actions.ts   # TanStack mutations for approve/reject
└── index.ts
```

## Related Code Files

- Move: `src/pages/ApprovalPage.tsx` → `features/approval/components/approval-page.tsx`
- Create: Extracted components, hooks, `index.ts`

## Implementation Steps

1. Create directory:
   ```bash
   mkdir -p src/features/approval/{components,hooks}
   ```

2. Move ApprovalPage:
   ```bash
   mv src/pages/ApprovalPage.tsx src/features/approval/components/approval-page.tsx
   ```

3. Extract sub-components from ApprovalPage (200 lines):
   - `approval-table.tsx`: Request list table
   - `reject-dialog.tsx`: Rejection reason dialog
   - `detail-dialog.tsx`: Request detail dialog

4. Create TanStack Query hooks:
   - `use-approval-requests.ts`: Fetch pending approval requests
   - `use-approval-actions.ts`: Approve/reject mutations with cache invalidation

5. Update imports:
   - `@/store/useStore` → local hooks
   - `@/api/leave-requests.api` → `@/features/leave-requests` (use re-exported API or types)
   - `LeaveTypeDto` → import from `@/features/config` (config owns leave-types)
   - `@/contexts/AuthContext` → `@/features/auth`
   - `@/components/ui/*` → `@/shared/ui/*`
   - `@/lib/leave-data` → `@/features/shared-reference-data`

6. Create barrel export:
   ```typescript
   // features/approval/index.ts
   export { ApprovalPage } from './components/approval-page';
   ```

7. Update `app/router.tsx` imports

8. Delete old `src/pages/ApprovalPage.tsx`

9. Build and verify: `bun run build`

## Success Criteria

- [ ] Approval feature self-contained in `features/approval/`
- [ ] Approve/reject flow works for Leader and Director roles
- [ ] N-level approval logic intact
- [ ] No Zustand store usage
- [ ] `bun run build` passes

## Risk Assessment

- **Cross-feature dependency**: Approval imports LeaveRequestDto from leave-requests. Must use public API only (`@/features/leave-requests`), not deep imports.
- **API calls**: Approval likely calls leave-requests API for update (approve/reject). Import via leave-requests public API.
