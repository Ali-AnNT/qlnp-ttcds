---
phase: 3
title: "Test & Verify"
status: pending
priority: P2
effort: "20m"
dependencies: [2]
---

# Phase 3: Test & Verify

## Overview

Compile check, manual smoke test, and ensure no regressions in dashboard or related features.

## Requirements

- Functional: Dashboard metrics display correct values from server
- Non-functional: No compile errors, no type errors, build passes

## Related Code Files

- Verify: `packages/web/src/features/dashboard/` (all modified files)
- Verify: `packages/api/Features/MyStats/` (backend already compiles)

## Implementation Steps

1. **Backend compile** — `cd packages/api && dotnet build` — already verified ✅
2. **Frontend compile** — `cd packages/web && bun run build` — verify no TS/build errors
3. **Lint** — `bun run lint` — check for warnings
4. **Manual smoke test** (if dev server available):
   - Login as CB.PCM user
   - Dashboard loads, 4 metric cards show values
   - Activity feed renders recent requests
   - CTA buttons display correct pending count
5. **Edge case verification**:
   - User with no leave requests → pendingCount=0, approvedCount=0, usedDays=0
   - User with no balance (new user) → auto-seeded, remainingDays shown
   - Year boundary → balance auto-seeded for current year

## Success Criteria

- [ ] `bun run build` passes with zero errors
- [ ] `bun run lint` passes (no new warnings)
- [ ] Dashboard metrics come from `useMyStats` (1 API call) not client aggregation
- [ ] Activity feed still renders correctly
- [ ] No TypeScript type errors

## Risk Assessment

Low — additive change, backend already tested via compile. Only risk is hook contract mismatch (frontend type vs backend DTO) which compile step catches.