---
phase: 7
title: "Calendar"
status: completed
priority: P2
effort: "30m"
dependencies: [1, 2, 5]
---

# Phase 7: Calendar

## Overview

Migrate calendar feature (CalendarPage) into `features/calendar/`. Calendar shows leave dates in calendar grid and list view. Depends on leave-requests for data.

## Requirements

- Functional: Calendar view and list view work unchanged
- Non-functional: Uses TanStack Query for fetching leave data

## Architecture

```
features/calendar/
├── components/
│   ├── calendar-page.tsx     # From src/pages/CalendarPage.tsx (172 lines)
│   ├── calendar-grid.tsx     # Extracted calendar grid from CalendarPage
│   └── calendar-list.tsx     # Extracted list view from CalendarPage
└── index.ts
```

## Related Code Files

- Move: `src/pages/CalendarPage.tsx` → `features/calendar/components/calendar-page.tsx`
- Create: Extracted components, `index.ts`

## Implementation Steps

1. Create directory:
   ```bash
   mkdir -p src/features/calendar/components
   ```

2. Move CalendarPage:
   ```bash
   mv src/pages/CalendarPage.tsx src/features/calendar/components/calendar-page.tsx
   ```

3. Extract sub-components (172 lines):
   - `calendar-grid.tsx`: Calendar month view
   - `calendar-list.tsx`: Day-based list view

4. Update imports:
   - `@/store/useStore` → TanStack Query hooks or direct API calls
   - `@/contexts/AuthContext` → `@/features/auth`
   - `@/api/*` → `@/features/leave-requests` for leave-request/balance types, `@/features/config` for LeaveTypeDto
   - `@/components/ui/*` → `@/shared/ui/*`
   - `@/lib/*` → `@/shared/lib/*`

5. Create barrel export:
   ```typescript
   // features/calendar/index.ts
   export { CalendarPage } from './components/calendar-page';
   ```

6. Update `app/router.tsx` imports

7. Delete old file

8. Build and verify: `bun run build`

## Success Criteria

- [x] Calendar feature self-contained in `features/calendar/`
- [x] Calendar grid and list views render correctly
- [x] No Zustand store usage
- [x] `bun run build` passes
