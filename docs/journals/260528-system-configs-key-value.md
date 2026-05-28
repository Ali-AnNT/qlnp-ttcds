# SystemConfigs Key-Value Table Implementation

**Date:** 2026-05-28
**Severity:** Medium
**Component:** System Configuration / Backend Persistence
**Status:** Resolved

## What Happened

Implemented persistent system-level configuration storage via a new `SystemConfigs` key-value table. This replaced scattered in-memory defaults and hardcoded magic numbers across the codebase. The work touched 4 phases: entity/migration, API endpoints, frontend ConfigPage wiring, and LeaveBalance seed enhancement.

8 seed config rows were added covering annual leave limits, carry-over rules, leave cycle, and per-role default days (CB.PCM, LD.PCM, GD.PGD, QTHT). The ConfigPage General tab now loads from the backend instead of using static preset values.

## Technical Details

**DbSet added:** `DbSet<SystemConfig>` in `AppDbContext`

**Seed data:**
- `max_annual_leave`: 12
- `min_request_days`: 1
- `max_carry_over`: 5
- `leave_cycle`: yearly
- `default_days_CB.PCM`: 14
- `default_days_LD.PCM`: 14
- `default_days_GD.PGD`: 16
- `default_days_QTHT`: 12

**LeaveBalance lazy seed enhancement:** Now checks `SystemConfigs` for role-based NPN defaults when a role has no existing balance. Falls back to `LeaveType.DefaultDays` if the config key is missing (backward compatibility).

## Key Decisions

**Chose key-value table:** KISS over building out structured config entities. Flexibility outweighs type safety for this use case. Easy to add new keys without migrations.

**Deferred approval_flow config:** `LeaveConfigs` N-level approval already covers this. Adding it to SystemConfigs would duplicate logic and create sync issues between tables.

**QTHT-only access control:** Config management is a system-administration concern. Restricting writes to QTHT role enforces proper separation of concerns.

## Lessons Learned

**The frustrating part:** Originally scoping included approval flow config, which would have pulled in cross-entity dependencies between SystemConfigs and LeaveConfigs. Cutting that scope early saved roughly 2 phases of integration complexity.

**What made this smooth:** Separating phases by layer (entity -> API -> frontend -> seed) made reviews surgical. Each phase touched distinct files with minimal overlap.

**Warning sign we caught:** ConfigPage was loading preset values hardcoded in the Vue component. Without the entity and API phases, this would have become technical debt that subsequent features would inherit.

## Rollout Notes

- Migration writes 8 rows on first run
- Existing LeaveBalance entries unaffected (lazy seed only applies to roles without balances)
- No approval_flow key exists in SystemConfigs; any code expecting it should fall back to LeaveConfigs

## Next Steps

None for now. Monitor config page usage in staging to confirm QTHT-only access works as intended.
