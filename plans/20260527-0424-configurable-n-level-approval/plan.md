---
title: "Configurable N-Level Approval Flow"
description: "Refactor approval system from hardcoded 1/2-level to config-driven N-level with multi-role per level. Add ApprovedLevel to LeaveRequest, remove approved_leader status, implement OR-logic multi-role approval."
status: complete
priority: P1
branch: "feat/configurable-approval-levels"
tags: [approval, config-driven, n-level, multi-role, refactor]
blockedBy: []
blocks: []
created: "2026-05-27T04:27:46.054Z"
createdBy: "ck:plan"
source: skill
---

# Configurable N-Level Approval Flow

## Overview

Refactor the approval system from hardcoded 1/2-level branching to a fully config-driven N-level approval flow where:
- Each `LeaveType` can have N approval levels (1, 2, 3, ...)
- Multiple roles can share the same level (OR logic — any approver at that level can advance)
- `ApprovedLevel` (int) on `LeaveRequest` tracks progress through levels
- Status simplified: `pending/approved/rejected/cancelled` (no more `approved_leader`)
- Scope rules remain per-role (LD.PCM = same department, GD.PGD = no scope check)

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-role at same level | OR logic | Any approver at that level can advance the request |
| Track progress | `ApprovedLevel` (int) on LeaveRequest | Simple, queryable, no new table |
| Status values | Remove `approved_leader`, keep `pending/approved/rejected/cancelled` | Status = final state; ApprovedLevel = progress |
| Scope rules | Keep per-role hardcoded in business logic | LD.PCM = same dept, GD.PGD = no scope. Extendable later |
| Balance deduction | Only on final approval (ApprovedLevel == maxLevel) | Don't deduct until fully approved |
| Cancel rules | Can cancel while ApprovedLevel < maxLevel | Natural extension of current logic |
| No config = error | Return 403 "Chưa cấu hình phê duyệt" | Don't silently default to any flow |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Entity & Migration](./phase-01-entity-migration.md) | Pending |
| 2 | [Approval Logic Refactor](./phase-02-approval-logic-refactor.md) | Pending |
| 3 | [Frontend Type Updates](./phase-03-frontend-type-updates.md) | Pending |
| 4 | [ConfigPage N-Level Dropdown](./phase-04-configpage-n-level-dropdown.md) | Pending |

## Dependencies

- ~~Seed data plan `260527-0317-update-leave-type-seed-data` provides LeaveConfig seed rows. Should be merged first.~~ **DONE**: LeaveConfig HasData seed added directly to AppDbContext — 9 rows migrated as part of Phase 1.
- This plan is in scope: backend approval refactor only (not UI redesign of ApprovalPage/LeaveMyPage status display).

## LeaveConfig Seed Data (Current Database State)

9 rows seeded in `LeaveConfigs`. NKL = 1-level approval, others = 2-level.

| Config Id | LeaveType (Code) | ApprovalLevel | ApproverRole | Flow |
|-----------|-----------------|---------------|--------------|------|
| 1 | NPN (Nghỉ phép năm) | 1 | LD.PCM | 2-level |
| 2 | NPN (Nghỉ phép năm) | 2 | GD.PGD | 2-level |
| 3 | NO (Nghỉ ốm) | 1 | LD.PCM | 2-level |
| 4 | NO (Nghỉ ốm) | 2 | GD.PGD | 2-level |
| 5 | NVR (Nghỉ việc riêng) | 1 | LD.PCM | 2-level |
| 6 | NVR (Nghỉ việc riêng) | 2 | GD.PGD | 2-level |
| 7 | **NKL (Nghỉ không lương)** | **1** | **LD.PCM** | **1-level** |
| 8 | NTS (Nghỉ thai sản) | 1 | LD.PCM | 2-level |
| 9 | NTS (Nghỉ thai sản) | 2 | GD.PGD | 2-level |

**Key rules:**
- NKL = 1-level: chỉ cần trưởng phòng (LD.PCM) duyệt
- NPN, NO, NVR, NTS = 2-level: trưởng phòng duyệt cấp 1, giám đốc duyệt cấp 2
- Scope: LD.PCM = cùng phòng ban; GD.PGD = không giới hạn scope
- Balance deduction: chỉ khi ApprovedLevel == maxLevel (duyệt xong cấp cuối)

## Blast Radius

Files referencing `approved_leader` (must all be updated):
- Backend: `Approve/Endpoint.cs`, `Reject/Endpoint.cs`, `Cancel/Endpoint.cs`, `Create/Data.cs`, `Update/Data.cs`, `Reports/Export/Models.cs`, `SeedHelper.cs`, `List/Data.cs`
- Frontend: `leave-data.ts`, `ApprovalPage.tsx`, `LeaveMyPage.tsx`, `DashboardPage.tsx`, `CalendarPage.tsx`, `SummaryPage.tsx`, `ReportsPage.tsx`, `ViolationsPage.tsx`, `LeaveNewPage.tsx`

Validation decisions:
- **approved_leader migration**: Convert to `status = "pending", ApprovedLevel = 1`
- **ApprovedBy field**: Keep as last approver only (audit trail via LeaveRequestAudit)
- **Cancel logic**: Cannot cancel approved requests (only pending/partially approved)

## Validation Log

### Session 1 — 2026-05-27
**Trigger:** /ck:plan validate
**Questions asked:** 4

#### Questions & Answers

1. **[Migration]** approved_leader rows: what status after migration?
   - Options: pending | Keep approved_leader | approved
   - **Answer:** pending — approved_leader → pending + ApprovedLevel=1, still awaiting next level
   - **Rationale:** Matches N-level flow where intermediate approvals keep status=pending

2. **[Architecture]** ApprovedBy field with N-level: store who?
   - Options: Last approver only | Final approver only
   - **Answer:** Last approver only
   - **Rationale:** Simple, matches current behavior. Per-level audit via LeaveRequestAudit.

3. **[Scope]** Can cancel approved requests (ApprovedLevel==maxLevel)?
   - Options: Cannot cancel approved | Can cancel + reverse balance
   - **Answer:** Cannot cancel approved
   - **Rationale:** Simpler, safer. Only pending/partially approved are cancellable.

4. **[Scope]** Missing files in blast radius (LeaveNewPage.tsx, ViolationsPage.tsx)?
   - Options: Add to phase 3 | Handle separately
   - **Answer:** Add to phase 3
   - **Rationale:** Both reference approved_leader, must be updated in same pass.

#### Verification Results
- **Tier:** Standard (4 phases → Fact Checker + Contract Verifier)
- **Claims checked:** 12
- **Verified:** 10 | **Failed:** 0 | **Unverified:** 2
- **Findings:** LeaveNewPage.tsx and ViolationsPage.tsx were NOT in original blast radius — added to phase 3. LeaveConfig check constraint `CK_LeaveConfig_ApprovalLevel >= 1` correctly retained (not removed). `ApprovedLevel` does not exist yet in codebase (confirmed). `MigrateApprovedDirectorStatusAsync` is called from Program.cs (confirmed).

#### Action Items
- [x] Add LeaveNewPage.tsx to phase 3 blast radius
- [x] Add ViolationsPage.tsx to phase 3 blast radius
- [x] Document ApprovedBy decision in phase 1
- [x] Document cancel logic decision in phase 2

### Session 2 — 2026-05-27
**Trigger:** /ck:plan validate (re-validation pass)
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** List/Data.cs has role-based query filtering not in blast radius. Add it?
   - **Answer:** Add to Phase 2 blast radius
   - **Rationale:** N-level approval changes which requests each role can see; hardcoded role filtering must be updated

2. **[Quality]** Phase 2 has duplicate step 6 numbering. Fix?
   - **Answer:** Yes, renumber
   - **Rationale:** Avoid confusion during implementation

3. **[Architecture]** ApprovalPage.tsx filtering approach for N-level?
   - **Answer:** Config-driven: load configs, match user role to level ApprovedLevel+1
   - **Rationale:** Each request shows where user's role matches the next approval level — dynamic, accurate, no noise

#### Verification Results
- **Tier:** Standard (4 phases → Fact Checker + Contract Verifier)
- **Claims checked:** 12
- **Verified:** 12 | **Failed:** 0 | **Unverified:** 0
- **Findings:** All paths verified against current codebase. `ApprovedLevel` confirmed not in codebase yet. `List/Data.cs` added to blast radius.

#### Action Items
- [x] Add List/Data.cs to Phase 2 blast radius
- [x] Fix Phase 2 step numbering
- [x] Detail ApprovalPage config-driven filtering in Phase 3

### Whole-Plan Consistency Sweep
- **Files reread:** plan.md, phase-01-entity-migration.md, phase-02-approval-logic-refactor.md, phase-03-frontend-type-updates.md, phase-04-configpage-n-level-dropdown.md
- **Decision deltas checked:** 3 (List/Data.cs blast radius, step renumbering, ApprovalPage filtering)
- **Reconciled stale references:** 2
  - Phase 2 step 7: corrected List/Data.cs change description from "config-driven role filtering" to "DTO projection update + role logic unchanged" (backend list returns all visible requests; frontend ApprovalPage handles level-based filtering)
  - Phase 3 ApprovalPage.tsx: expanded filtering description to detail config-driven approach
- **Unresolved contradictions:** 0