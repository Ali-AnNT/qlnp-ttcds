# Brainstorm: SystemConfigs Key-Value Table

**Date:** 2026-05-28
**Status:** Approved

## Problem Statement

Leave management system needs persistent system-level configuration for general settings (max annual leave, min request days, max carry-over, leave cycle) and per-role default days (CB.PCM=14, LD.PCM=14, GD.PGD=16, QTHT=12). Currently:

- No backend storage for these settings — all hardcoded or frontend-only
- `ConfigPage.tsx:151` has TODO: *"Save per-role default days via dedicated config once backend endpoint exists"*
- `LeaveType.DefaultDays` is flat per-type (NPN=12), not per-role
- Startup seed uses `LeaveType.DefaultDays` which doesn't account for role-based differences

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Table approach | Key-value (Approach A) | Flexible, KISS, matches user's mental model |
| Interaction with LeaveConfigs | Parallel — no changes | LeaveConfigs handles N-level approval, SystemConfigs handles general settings |
| approval_flow config | Not needed | N-level LeaveConfigs already defines approval flow in detail |
| Access control | QTHT-only (Admin) | Matches current ConfigPage access pattern |
| NPN balance seed | Lazy seed per-role | Startup uses LeaveType.DefaultDays; per-request lazy seed uses SystemConfigs default_days_by_role |
| Existing balance correction | Yes — if UsedDays=0 and TotalDays differs from role default, update | Ensures users get correct per-role NPN days on first access |

## Schema Design

### SystemConfigs Entity

```csharp
public class SystemConfig {
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    [MaxLength(50)]
    public string ConfigKey { get; set; } = null!;  // unique

    [MaxLength(100)]
    public string ConfigValue { get; set; } = null!;

    [MaxLength(200)]
    public string? Description { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

**Unique index on ConfigKey.**

### Seed Data (8 rows)

| ConfigKey | ConfigValue | Description |
|-----------|-------------|-------------|
| `max_annual_leave` | `12` | So ngay phep nam toi da |
| `min_request_days` | `1` | So ngay toi thieu khi tao don |
| `max_carry_over` | `5` | So ngay phep duoc chuyen sang nam sau |
| `leave_cycle` | `yearly` | Chu ky tinh phep: yearly hoac monthly |
| `default_days_CB.PCM` | `14` | So ngay phep mac dinh cho Can bo phong chuyen mon |
| `default_days_LD.PCM` | `14` | So ngay phep mac dinh cho Lanh dao phong chuyen mon |
| `default_days_GD.PGD` | `16` | So ngay phep mac dinh cho Giam doc / Pho giam doc |
| `default_days_QTHT` | `12` | So ngay phep mac dinh cho Quan tri he thong |

**Convention for default_days keys:** `default_days_{role_suffix}` where role_suffix = `CB.PCM`, `LD.PCM`, `GD.PGD`, `QTHT` (matching AppRoles constant suffix after `QLNP.` prefix).

## Endpoints

| Method | Path | Access | Description |
|--------|------|-------|-------------|
| GET | `/api/system-configs` | QTHT | List all configs |
| PUT | `/api/system-configs` | QTHT | Replace all configs (same ReplaceAll pattern as existing Config endpoint) |

**Vertical slice location:** `Features/SystemConfigs/`

## Backend Integration Points

### 1. LeaveBalance Seed Enhancement

**Current flow:** `LeaveType.DefaultDays` for all balance creation.

**New flow:**
- **Startup seed** (no role context): Use `LeaveType.DefaultDays` as before
- **Per-request lazy seed** (has JWT role):
  - For NPN (annual leave): look up `default_days_{role}` from SystemConfigs
  - If found: create/update balance with that value
  - If not found: fall back to `LeaveType.DefaultDays`
  - For other leave types: use `LeaveType.DefaultDays` as before

**Existing balance correction (NPN only):**
- If NPN balance exists with `UsedDays == 0` and `TotalDays != role_default`
- Update `TotalDays` to `role_default` from SystemConfigs
- Only happens on first per-request lazy seed access

### 2. Future Integration (Not in Scope)

- `max_annual_leave`: Validate leave request doesn't exceed max
- `min_request_days`: Validate minimum days per request
- `max_carry_over`: Year-end carry-over calculation
- `leave_cycle`: Monthly vs yearly leave cycle logic

## Frontend Changes

### ConfigPage.tsx — General Tab

- **Current:** Hardcoded `defaultDaysByRole` state + TODO stub save
- **New:** Load from `GET /api/system-configs`, save to `PUT /api/system-configs`
- Remove TODO comment
- Add `max_annual_leave`, `min_request_days`, `max_carry_over`, `leave_cycle` fields to General tab UI

### New API Client

- `packages/web/src/api/system-configs.api.ts`
- Methods: `get()`, `update(configs)`

## Touchpoints (Files to Modify/Create)

### New Files
1. `packages/api/Entities/SystemConfig.cs` — Entity
2. `packages/api/Features/SystemConfigs/Get/Endpoint.cs` — GET endpoint
3. `packages/api/Features/SystemConfigs/Get/Data.cs` — Query
4. `packages/api/Features/SystemConfigs/Update/Endpoint.cs` — PUT endpoint
5. `packages/api/Features/SystemConfigs/Update/Data.cs` — ReplaceAll logic
6. `packages/api/Features/SystemConfigs/SystemConfigDto.cs` — DTO
7. `packages/web/src/api/system-configs.api.ts` — Frontend API client

### Modified Files
1. `packages/api/Data/AppDbContext.cs` — Add DbSet + seed data
2. `packages/api/Features/LeaveBalances/Seed/Data.cs` — Role-based NPN default on lazy seed
3. `packages/web/src/pages/ConfigPage.tsx` — Replace TODO with real API calls

### Migration
- EF Core migration: add `SystemConfigs` table + seed data

## Scope Boundary

**In scope:**
- SystemConfigs table, entity, migration, seed data
- GET/PUT endpoints
- ConfigPage General tab wired to real backend
- LeaveBalance lazy seed uses role-based NPN default

**Out of scope:**
- Changing LeaveConfigs (N-level approval)
- Changing LeaveType.DefaultDays (keep as fallback)
- Validation enforcement (max_annual_leave, min_request_days) — future
- Carry-over calculation — future
- Leave cycle logic — future

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Existing NPN balances with wrong TotalDays after config change | Medium | Only correct if UsedDays=0; don't touch "live" balances |
| ConfigKey naming inconsistency (dots vs underscores) | Low | Document convention clearly; service layer handles mapping |
| ReplaceAll pattern loses update timestamps | Low | UpdatedAt set on insert; future: add CreatedAt if needed |

## Implementation Phases (High-Level)

1. **Entity + Migration** — SystemConfig entity, AppDbContext, seed data, EF migration
2. **API Endpoints** — GET/PUT vertical slices
3. **Frontend ConfigPage** — Wire General tab to real API
4. **LeaveBalance Seed Enhancement** — Role-based NPN default in lazy seed