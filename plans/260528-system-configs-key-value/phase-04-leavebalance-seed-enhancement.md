---
phase: 4
title: "LeaveBalance Seed Enhancement"
status: complete
priority: P2
effort: "1h"
dependencies: [1]
---

# Phase 4: LeaveBalance Seed Enhancement

## Overview

Enhance LeaveBalance lazy seed to use `default_days_{role}` from SystemConfigs when creating NPN balances. Also correct existing NPN balances where `UsedDays=0` and `TotalDays` doesn't match role-based default.

## Requirements

- Functional: Per-request lazy seed uses role-based default for NPN type; existing unused NPN balances get corrected
- Non-functional: Startup seed unchanged (no role context); backward compatible with `LeaveType.DefaultDays` fallback

## Architecture

**Flow for lazy seed (per-request, has JWT role):**

```
1. Determine user's role from JWT claims (already available in CurrentUser)
2. Look up NPN LeaveType (Code = "NPN")
3. For NPN:
   a. Check SystemConfigs for key "default_days_{role_suffix}"
   b. If found → use that value as TotalDays
   c. If not found → fall back to LeaveType.DefaultDays
4. For other leave types → use LeaveType.DefaultDays as before
```

**Correction for existing unused NPN balances:**

```
1. After ensuring all balances exist, check NPN balance
2. If UsedDays == 0 and TotalDays != role_default:
   → Update TotalDays to role_default
3. If UsedDays > 0 → don't touch (balance is "live")
```

**Key mapping:**
- Role `QLNP.CB.PCM` → config key `default_days_CB.PCM`
- Role `QLNP.LD.PCM` → config key `default_days_LD.PCM`
- Role `QLNP.GD.PGD` → config key `default_days_GD.PGD`
- Role `QLNP.QTHT` → config key `default_days_QTHT`

Helper: `string ToConfigKey(string role) => $"default_days_{role.Replace("QLNP.", "")}";`

## Related Code Files

- Modify: `packages/api/Features/LeaveBalances/Seed/Data.cs` — role-based NPN TotalDays
- Modify: `packages/api/Features/LeaveBalances/My/Data.cs` — pass role to seed, correct existing balance
- Modify: `packages/api/Features/LeaveBalances/List/Data.cs` — pass role for single-user seed (if applicable)

## Implementation Steps

1. Add helper method to `Data.cs`:
   ```csharp
   private static string DefaultDaysKey(string role) =>
       $"default_days_{role.Replace("QLNP.", "")}";
   ```

2. Modify `EnsureBalancesAsync` to accept optional `userRole`:
   - Add parameter: `string? userRole = null`
   - When creating NPN balance and userRole provided:
     - Look up `default_days_{role_suffix}` from `_db.SystemConfigs`
     - Use found value (parsed as decimal), else `LeaveType.DefaultDays`
   - Non-NPN types: always use `LeaveType.DefaultDays`

3. Modify `EnsureBalancesForUsersAsync` — keep as-is (batch seed, no role context available)

4. Add correction logic after lazy seed in "My" endpoint:
   - After `EnsureBalancesAsync`, re-query NPN balance
   - If `UsedDays == 0` and role default exists and `TotalDays != role_default`:
     - `balance.TotalDays = role_default`
     - `await db.SaveChangesAsync()`

5. Pass user role from "My" endpoint to `EnsureBalancesAsync`:
   - `CurrentUser` has `Roles` list — resolve highest-priority role via `AppRoles.Priority`

6. Verify: user with role LD.PCM → NPN balance seeds with 14 instead of 12

## Success Criteria

- [ ] User with role LD.PCM gets NPN TotalDays=14 on lazy seed (not 12)
- [ ] User with role GD.PGD gets NPN TotalDays=16 on lazy seed
- [ ] User with role CB.PCM gets NPN TotalDays=14 on lazy seed
- [ ] Existing NPN balance with UsedDays=0 gets corrected to role default
- [ ] Existing NPN balance with UsedDays>0 stays unchanged
- [ ] Non-NPN leave types still use LeaveType.DefaultDays
- [ ] Startup seed unchanged (still uses LeaveType.DefaultDays)
- [ ] `dotnet build` succeeds

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Role not in SystemConfigs | Low | Fall back to LeaveType.DefaultDays |
| Multiple roles per user | Low | Use highest-priority role via AppRoles.Priority |
| Correction overwrites admin-set TotalDays | Medium | Only correct when UsedDays=0 — if admin set it and user hasn't used any days, role default is more correct |
| Concurrent seed + correction race | Low | Same DbUpdateException handling already in place |