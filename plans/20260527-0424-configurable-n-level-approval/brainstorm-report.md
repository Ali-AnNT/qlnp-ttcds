# Brainstorm Report: Configurable N-Level Approval with Multi-Role Per Level

**Date:** 2026-05-27
**Status:** Approved — Approach A selected

---

## Problem Statement

Current approval system is hardcoded for 1 or 2 levels:
- `LeaveConfig.ApprovalLevel` only supports 1 or 2
- `LeaveRequest.Status` uses `approved_leader` for level-1 approved (hardcoded)
- Backend logic branches on `isSingleLevel` (maxLevel <= 1) — no extensibility
- Frontend `ApprovalPage` hardcodes `approved_leader` status filtering
- Roles are limited to `LD.PCM` and `GD.PGD`

**Goal:** Make approval fully config-driven. Each `LeaveType` can have N approval levels, each level can have multiple roles (OR logic — any role at the level can approve). No hardcoded level limits.

---

## Agreed Approach: Config-Driven Multi-Role (Approach A)

### Core Design

**LeaveConfig table (unchanged schema, semantics change):**
- Each row = 1 approver role at 1 level for 1 leave type
- Multiple rows with same `(LeaveTypeId, ApprovalLevel)` = multiple roles at that level
- `ApprovalLevel` is now an ordinal (1, 2, 3...) — not limited to 1 or 2

**LeaveRequest changes:**
- Add `ApprovedLevel` (int, default 0) — tracks how many levels have been approved
- Remove `approved_leader` from Status values
- Status remains: `pending` → `approved` → `rejected` | `cancelled`
- When `ApprovedLevel < maxConfigLevel` → still in progress
- When `ApprovedLevel == maxConfigLevel` → Status becomes `approved`

**Approval logic:**
1. Query `LeaveConfigs` for the request's `LeaveTypeId`
2. Group by `ApprovalLevel`, order ascending → get ordered list of levels
3. Current level = `ApprovedLevel + 1`
4. Check if current user's role is in the config for that level
5. Apply scope rules per role (LD.PCM → same department; GD.PGD → no scope check; extendable)
6. If approved: increment `ApprovedLevel`. If `ApprovedLevel == maxLevel`, set `Status = "approved"` and upsert balance
7. If rejected: set `Status = "rejected"`

**Example configs:**

| LeaveTypeId | ApprovalLevel | ApproverRole  |
|-------------|---------------|---------------|
| 1 (NPN)     | 1             | LD.PCM        |
| 1 (NPN)     | 2             | GD.PGD        |
| 2 (NO)      | 1             | LD.PCM        |
| 2 (NO)      | 1             | GD.PGD        |
| 3 (NVR)     | 1             | LD.PCM        |
| 3 (NVR)     | 2             | GD.PGD        |
| 3 (NVR)     | 3             | TGĐ           |

In this example:
- NPN: 2-level (LD.PCM → GD.PGD)
- NO: 1-level (LD.PCM OR GD.PGD can approve)
- NVR: 3-level (LD.PCM → GD.PGD → TGĐ)

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-role at same level | OR logic | Any approver at that level can advance the request |
| Track progress | `ApprovedLevel` int on LeaveRequest | Simple, queryable, no new table needed |
| Status values | Remove `approved_leader`, keep `pending/approved/rejected/cancelled` | Status reflects final state; `ApprovedLevel` tracks progress |
| Scope rules | Keep per-role scope rules (hardcoded in business logic) | LD.PCM = same dept, others = no scope. Extendable by adding more rules |
| Balance deduction | Only on final approval (`ApprovedLevel == maxLevel`) | Matches current behavior — don't deduct until fully approved |
| Cancel rules | Can cancel if `ApprovedLevel < maxLevel` (any intermediate state) | Natural extension of current 2-level cancel logic |

---

## Changes Required

### Backend (packages/api)

1. **LeaveRequest entity** — Add `ApprovedLevel` property (int, default 0)
2. **Migration** — Add `ApprovedLevel` column, migrate `approved_leader` → `status = "pending", ApprovedLevel = 1`
3. **Approve/Endpoint.cs** — Rewrite: remove `isSingleLevel` branching, implement config-driven N-level logic
4. **Reject/Endpoint.cs** — Rewrite: any approver at current level can reject
5. **Cancel/Endpoint.cs** — Rewrite: can cancel if `ApprovedLevel < maxLevel`
6. **LeaveRequestDto** — Add `approvedLevel` field
7. **Scope rules** — Extract to a helper: `CanApproveAtLevel(role, level, config, request, currentUser)`
8. **Data.cs** — `GetApprovalLevelsAsync` → `GetApprovalConfigsAsync` (return full configs, not just levels)

### Frontend (packages/web)

1. **leave-data.ts** — Remove `approved_leader` from `LeaveStatus` type, add `approvedLevel` to interfaces
2. **ApprovalPage.tsx** — Update filtering logic: show requests where current user's role matches current approval level's config
3. **LeaveMyPage.tsx** — Update status display to show approval progress (e.g. "Cấp 1/3 đã duyệt")
4. **ConfigPage.tsx** — Update approval level dropdown to allow arbitrary levels (not just 1/2)
5. **API types** — Add `approvedLevel` to `LeaveRequestDto`

---

## Scope Boundaries

### In Scope
- Backend: Approval flow refactor (Approve, Reject, Cancel endpoints)
- Backend: LeaveConfig semantics change (N levels, multi-role)
- Backend: LeaveRequest entity changes (ApprovedLevel)
- Backend: Migration for ApprovedLevel column
- Frontend: Type updates and API client updates
- Frontend: ConfigPage level dropdown update

### Out of Scope (this round)
- Frontend UI redesign for ApprovalPage/LeaveMyPage (status display, progress indicators)
- Adding new roles (TGĐ, TP.KH etc.) — just make the system capable
- Notification system for approval progress
- Audit trail improvements (LeaveRequestAudit already exists)
- LeaveRequestApproval separate table (future: detailed audit per step)

---

## Risks

| Risk | Mitigation |
|------|------------|
| Backward compat: existing `approved_leader` records | Migration updates `approved_leader` → recalculate ApprovedLevel from audit or set ApprovedLevel=1 |
| Frontend breaks if deployed before backend | Deploy backend first, frontend after. `approved_leader` status still works during transition |
| No config for LeaveType = what happens? | Default: if no configs exist, require at least level 1 (any approver role). Or return 403 "no approval config" |
| Role scope rules hardcoded | Acceptable for now. Future: add ScopeType column to LeaveConfig |

---

## Next Steps

1. Create implementation plan via `/ck:plan`
2. Implement backend changes (entity, migration, endpoints)
3. Update frontend types and API client
4. Update ConfigPage level dropdown
5. Test approval flows (1-level, 2-level, multi-role same level)