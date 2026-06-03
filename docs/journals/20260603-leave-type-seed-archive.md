# Update LeaveType & LeaveConfig Seed Data

**Date**: 2026-06-03
**Severity**: Low
**Component**: LeaveType / LeaveConfig seed data + EF migration
**Status**: Resolved

## What Was Delivered

Replaced 3 English-code LeaveType rows (`annual`/`sick`/`personal`) with 5 Vietnamese-code rows (`NPN`/`NO`/`NVR`/`NKL`/`NTS`) and added 9-row `LeaveConfig` seed data for approval flow configuration. Shipped in two commits on `feat/configurable-approval-levels`: `feat(seed): update LeaveType seed data to Vietnamese codes` (#21) and `feat(approval): configurable N-level approval per leave type` (#20) which carried the `LeaveConfig` `HasData` block.

## Key Technical Decisions

### Data Mapping

| Id | Code | Name | DefaultDays | Notes |
|----|------|------|-------------|-------|
| 1 | `NPN` | Nghỉ phép năm | 12 | was `annual` |
| 2 | `NO`  | Nghỉ ốm | 30 | was `sick`, DefaultDays 0→30 |
| 3 | `NVR` | Nghỉ việc riêng | 3 | was `personal` |
| 4 | `NKL` | Nghỉ không lương | 0 | NEW |
| 5 | `NTS` | Nghỉ thai sản | 180 | NEW |

### Impact on Existing Data

- **LeaveBalances**: FK is by `LeaveType.Id`, not `Code`. Existing balances (referencing Id=1/2/3) unaffected by code rename. Confirmed safe.
- **DefaultDays change (Id=2, 0→30)**: only affects newly-created LeaveBalance rows. Existing balances retain their original `TotalDays` value at time of grant.
- **Single migration** for both LeaveType updates and LeaveConfig inserts: `20260527032405_UpdateLeaveTypeSeedData` + `20260527061558_SeedLeaveConfigs`. Both reversible via `Down` method.
- **No hardcoded references** to old codes survived outside seed data. One frontend test file (`useStore.test.ts`) checked; the `reason: "sick"` string was free-text, not a code reference, so left as-is. `leaveTypeId: 1` still valid since Id=1 still maps to NPN.
- **LeaveConfig seed is baseline-only** — runtime `Config/Update` endpoint (`ReplaceAllAsync`) overrides at runtime without migration conflicts. Comment added to `AppDbContext.cs` to make this explicit.

## Approval Flow Config

| LeaveType | Levels | Flow |
|-----------|--------|------|
| NPN (1) | 2 | LD.PCM → GD.PGD |
| NO (2)  | 2 | LD.PCM → GD.PGD |
| NVR (3) | 2 | LD.PCM → GD.PGD |
| NKL (4) | 1 | LD.PCM only |
| NTS (5) | 2 | LD.PCM → GD.PGD |

9 config rows total (Config Ids 1-9 with explicit values for stable EF tracking). NKL = 1-level approval — unpaid leave skips PGD review since no salary impact. All other types = 2-level.

## Lessons Learned

- **FK-by-Id design paid off** — code rename was zero-risk for existing balances. Schema design that decouples identifiers from display labels is worth the upfront discipline.
- **HasData + explicit Ids is the right EF Core pattern for baseline config** that application startup logic depends on. SeedHelper is for runtime-upsertable data only — its ordering is non-deterministic relative to startup migrations like `MigrateLegacyStatusesAsync`.
- **Two related migrations shipped separately** (LeaveType update first, LeaveConfig seed 3 hours later) is fine here because `LeaveConfig` is a new table. For future combined seed updates, prefer a single migration to keep deploy steps atomic.
- **Free-text vs code references in tests** is a real source of false positives when grepping for stale identifiers. The `reason: "sick"` finding is a reminder: distinguish "sick the code" from "sick the user-entered reason" before churning test data.

## Next Steps

- None outstanding. All 3 phases completed and merged to `dev` via #20 and #21.
- Monitor production for any latent hardcoded `annual`/`sick`/`personal` references in logs or analytics that the codebase grep missed.
- If NTS gets used and 180 days proves wrong, update DefaultDays in a new migration (not by editing this one).
