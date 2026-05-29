---
phase: 11
title: "Config"
status: pending
priority: P2
effort: "1h"
dependencies: [1, 2, 5]
---

# Phase 11: Config

## Overview

Migrate config feature (ConfigPage, system configs API, leave types API, config API) into `features/config/`. Admin-only page for system settings, leave types management, and approval flow configuration. Second largest page at 497 lines.

## Requirements

- Functional: General settings, default days, leave type CRUD, approval flow config all work
- Non-functional: Well-decomposed into focused components under 200 lines each

## Architecture

```
features/config/
├── api/
│   ├── config.api.ts          # From src/api/config.api.ts (leave configs)
│   ├── system-configs.api.ts  # From src/api/system-configs.api.ts
│   ├── leave-types.api.ts     # From src/api/leave-types.api.ts — config owns CRUD
│   └── types.ts               # ConfigDto, SystemConfigDto, LeaveConfigDto, LeaveTypeDto
├── components/
│   ├── config-page.tsx         # From src/pages/ConfigPage.tsx (497 lines → thin shell)
│   ├── general-settings.tsx    # General system settings section
│   ├── default-days-settings.tsx # Role-based default days section
│   ├── leave-type-manager.tsx  # Leave type CRUD section
│   ├── approval-flow-manager.tsx # Approval flow config section
│   ├── leave-type-dialog.tsx   # Create/edit leave type dialog
│   └── approval-dialog.tsx     # Edit approval config dialog
├── hooks/
│   ├── use-leave-types.ts      # TanStack Query for leave types
│   ├── use-approval-config.ts  # TanStack Query for approval config
│   └── use-system-configs.ts   # TanStack Query for system configs
└── index.ts
```

## Related Code Files

- Move: `src/pages/ConfigPage.tsx` → `features/config/components/config-page.tsx`
- Move: `src/api/config.api.ts` → `features/config/api/config.api.ts`
- Move: `src/api/system-configs.api.ts` → `features/config/api/system-configs.api.ts`
- Move: `src/api/leave-types.api.ts` → `features/config/api/leave-types.api.ts` (config owns leave-types CRUD)
- Create: Extracted components (6), hooks (3), types, `index.ts`

## Implementation Steps

1. Create directory:
   ```bash
   mkdir -p src/features/config/{api,components,hooks}
   ```

2. Move API modules:
   ```bash
   mv src/api/config.api.ts src/features/config/api/config.api.ts
   mv src/api/system-configs.api.ts src/features/config/api/system-configs.api.ts
   mv src/api/leave-types.api.ts src/features/config/api/leave-types.api.ts  # Config owns CRUD
   ```

3. Extract types into `api/types.ts`:
   - `ConfigDto`, `SystemConfigDto` from respective API files
   - `LeaveTypeDto` from leave-types.api (re-exported for other features)
   - `LeaveConfigDto` if applicable

4. Move ConfigPage:
   ```bash
   mv src/pages/ConfigPage.tsx src/features/config/components/config-page.tsx
   ```

5. Extract sub-components from ConfigPage (497 lines → 7 files):
   - `general-settings.tsx`: General system settings tab/section
   - `default-days-settings.tsx`: Role-based default days configuration
   - `leave-type-manager.tsx`: Leave type list + CRUD actions
   - `approval-flow-manager.tsx`: Approval flow configuration
   - `leave-type-dialog.tsx`: Create/edit leave type dialog
   - `approval-dialog.tsx`: Approval config edit dialog

6. Create TanStack Query hooks:
   - `use-leave-types.ts`: Leave types query + mutations
   - `use-approval-config.ts`: Approval config query + mutations
   - `use-system-configs.ts`: System configs query + mutations

7. Update imports:
   - `@/store/useStore` → local hooks
   - `@/api/*` → relative `../api/*`
   - `@/contexts/AuthContext` → `@/features/auth`
   - `@/components/ui/*` → `@/shared/ui/*`

8. Create barrel export:
   ```typescript
   // features/config/index.ts
   export { ConfigPage } from './components/config-page';
   export type { ConfigDto, SystemConfigDto, LeaveTypeDto } from './api/types';
   // Note: LeaveTypeDto is re-exported here so other features (leave-requests, dashboard, calendar)
   // can import from @/features/config instead of deep-importing leave-types.api.ts
   ```

9. Update `app/router.tsx` imports

10. Delete old files

11. Build and verify: `bun run build`

## Success Criteria

- [ ] Config feature self-contained in `features/config/`
- [ ] All 7 components render correctly
- [ ] System settings, leave types, approval config CRUD all work
- [ ] Each component file under 200 lines
- [ ] No Zustand store usage
- [ ] `bun run build` passes

## Risk Assessment

- **High complexity**: 497 lines split into 7 components. Same extraction strategy as violations.
- **Leave-types ownership**: Config owns leave-types CRUD and re-exports `LeaveTypeDto` from its public API. Other features import from `@/features/config`. Validated decision — avoids type drift. <!-- Updated: Validation Session 1 - config owns leave-types -->
