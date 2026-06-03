---
phase: 6
title: "Test"
status: done
priority: P1
effort: "30min"
dependencies: [2, 3, 4, 5]
---

# Phase 6: Test

## Overview

Verify all auto-approve scenarios work correctly. Delegate to tester agent for API-level validation.

## Requirements

- All 6 scenarios from brainstorm must pass
- Existing manual approve flow unchanged
- Balance deduction correct for both auto-approve and manual approve paths

## Implementation Steps

1. Compile check: `dotnet build packages/api` — zero errors
2. Start API: `pnpm api:watch`
3. Test auto-approve scenarios (API calls or integration tests):

   | # | Test Case | Expected |
   |---|-----------|----------|
   | 1 | Staff creates NPN | pending, ApprovedLevel=0 |
   | 2 | Leader creates NPN | pending, ApprovedLevel=1, ApprovedBy=leader |
   | 3 | Leader creates NKL | approved, ApprovedLevel=1, balance deducted |
   | 4 | Director creates NPN | approved, ApprovedLevel=2, balance deducted |
   | 5 | Director creates NKL | approved, ApprovedLevel=1, balance deducted (auto-all) |
   | 6 | Admin creates NPN | approved, ApprovedLevel=2, balance deducted |
   | 7 | Create with zero LeaveConfig | 403 blocked |
   | 8 | Manual approve (Staff request by Leader) | pending→ApprovedLevel=1, same as before |
   | 9 | Manual approve (Leader-approved by Director) | approved, balance deducted |

4. Verify balance deduction is correct (check LeaveBalances table)
5. Verify no regression in existing approve/reject/cancel endpoints

## Success Criteria

- [ ] All 9 test cases pass
- [ ] No compile errors
- [ ] Balance amounts correct (UsedDays matches TotalDays for approved requests)
- [ ] No regression in manual approve/reject/cancel flows
- [ ] Zero LeaveConfig → 403 still blocks creation

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Integration test env not available | MEDIUM | Use `dotnet build` + manual API testing |
| Balance double-deducted | LOW | Verify each scenario, check LeaveBalances rows |