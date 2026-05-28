---
phase: 3
title: "Frontend ConfigPage"
status: pending
priority: P2
effort: "1.5h"
dependencies: [2]
---

# Phase 3: Frontend ConfigPage

## Overview

Wire ConfigPage General tab to real `/api/system-configs` backend. Replace hardcoded `defaultDaysByRole` state and TODO stub with actual API calls. Add general settings fields (max_annual_leave, min_request_days, max_carry_over, leave_cycle).

## Requirements

- Functional: General tab loads from GET, saves to PUT, all 8 configs editable
- Non-functional: Follow existing ConfigPage patterns (api client, toast feedback, admin-only edit)

## Architecture

```
packages/web/src/api/system-configs.api.ts  # New API client
packages/web/src/pages/ConfigPage.tsx        # Modified: wire General tab
```

## Related Code Files

- Create: `packages/web/src/api/system-configs.api.ts`
- Modify: `packages/web/src/pages/ConfigPage.tsx`

## Implementation Steps

1. Create `system-configs.api.ts`:
   ```typescript
   import { api } from "./client";

   export interface SystemConfigDto {
     id: number;
     configKey: string;
     configValue: string;
     description: string | null;
     updatedAt: string;
   }

   export const systemConfigsApi = {
     get: () => api.get<SystemConfigDto[]>("/system-configs"),
     update: (data: SystemConfigDto[]) => api.put<SystemConfigDto[]>("/system-configs", data),
   };
   ```

2. In `ConfigPage.tsx`:
   - Add `systemConfigs` state: `SystemConfigDto[]`
   - Add `loadSystemConfigs()` on mount
   - Replace hardcoded `defaultDaysByRole` — derive from `systemConfigs` where key starts with `default_days_`
   - Add state for general settings: `maxAnnualLeave`, `minRequestDays`, `maxCarryOver`, `leaveCycle`
   - Replace `saveGeneralConfig()`:
     - Build `SystemConfigDto[]` from all state values
     - Call `systemConfigsApi.update(allConfigs)`
     - Remove TODO comment at line 151

3. Update General tab UI:
   - Add section for general settings (above role-based defaults):
     - Max annual leave (number input)
     - Min request days (number input)
     - Max carry-over days (number input)
     - Leave cycle (select: yearly / monthly)
   - Keep role-based defaults section below
   - All fields disabled when `!isAdmin`

4. Verify: load page → edit values → save → reload → values persist

## Success Criteria

- [ ] General tab loads all 8 configs from backend
- [ ] Saving updates all configs via PUT
- [ ] Role-based defaults populated from `default_days_*` keys
- [ ] General settings (max_annual_leave, min_request_days, max_carry_over, leave_cycle) editable
- [ ] Non-admin sees read-only values
- [ ] TODO comment at line 151 removed
- [ ] `pnpm build` succeeds

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| ConfigKey format mismatch (dots) | Low | Frontend uses exact same key format as backend |
| ReplaceAll overwrites all rows | Medium | User sees all values; save sends everything — no partial updates |