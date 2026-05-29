---
title: "Refactor Web Frontend to React VSA"
description: "Migrate packages/web from layered architecture (pages/api/components/store) to Vertical Slice Architecture following react-vsa skill conventions"
status: in-progress
priority: P1
branch: "refactor/adjust-api-arch-follow-vsa-and-fastendpoint"
tags: [refactor, architecture, react, vsa]
blockedBy: []
blocks: []
created: "2026-05-28T09:50:42.386Z"
createdBy: "ck:plan"
source: skill
scout: "./reports/scout-report.md"
---

# Refactor Web Frontend to React VSA

## Overview

Migrate `packages/web/src` from layered architecture to Vertical Slice Architecture (Simple VSA). Current: pages + api + components + single Zustand store. Target: `features/` + `shared/` + `app/` with per-feature colocation, public API exports, and TanStack Query for server state.

**Scope:** Frontend only. No backend changes. No functional changes — pure structural refactor.

**Scout report:** [scout-report.md](./reports/scout-report.md)

## Target Structure

```
src/
├── app/           # Entry, providers, routing
├── features/      # 10 features, each self-contained
│   ├── auth/      ├── layout/    ├── dashboard/
│   ├── leave-requests/ ├── approval/  ├── calendar/
│   ├── summary/   ├── reports/   ├── violations/
│   ├── config/    └── shared-reference-data/
├── shared/        # UI kit, hooks, lib, api client
└── test/
```

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Shared Infrastructure & App Layer](./phase-01-shared-infrastructure-app-layer.md) | ✅ Done | 2h |
| 2 | [Auth](./phase-02-core-features-auth.md) | ✅ Done | 30m |
| 3 | [Layout](./phase-03-layout.md) | ✅ Done | 30m |
| 4 | [Dashboard](./phase-04-dashboard.md) | ✅ Done | 30m |
| 5 | [Leave Requests](./phase-05-leave-requests.md) | ✅ Done | 1h |
| 6 | [Approval](./phase-06-approval.md) | ✅ Done | 45m |
| 7 | [Calendar](./phase-07-director-admin-features-calendar.md) | ✅ Done | 30m |
| 8 | [Summary](./phase-08-summary.md) | ✅ Done | 45m |
| 9 | [Reports](./phase-09-reports.md) | ✅ Done | 30m |
| 10 | [Violations](./phase-10-violations.md) | ✅ Done | 1h |
| 11 | [Config](./phase-11-config.md) | ✅ Done | 1h |
| 12 | [Cleanup & ESLint Boundaries](./phase-12-cleanup-eslint-boundaries.md) | ✅ Done | 1h |

## Migration Strategy

**Approach:** Bottom-up. Shared first, then features in dependency order, cleanup last.

**State migration:** Replace single Zustand `useStore` entirely with TanStack Query hooks per feature. AuthContext stays global. No Zustand feature stores — all server state via TanStack Query, UI state via useState/useReducer.

**Rule:** App compiles and runs after every phase. No broken intermediate states.

## Key Risks

1. **Store replacement** — `useStore` has 5 domains. Must migrate all 9 consumers to TanStack Query before removing.
2. **Import churn** — ~40 files need import path updates. Automated with find-replace.
3. **Large pages** — ConfigPage (497 lines), ViolationsPage (439 lines) need component extraction.

## Dependencies

None. This plan is self-contained.

## Validation Log

### Session 1 — 2026-05-29
**Trigger:** `/ck:plan validate` post-plan validation
**Questions asked:** 4

#### Verification Results
- **Tier:** Full (12 phases)
- **Claims checked:** 40
- **Verified:** 39 | **Failed:** 1 | **Unverified:** 0

##### Failures
1. [Fact Checker] `src/components/ui/` — plan says ~60 files, actual: 49 files. Non-blocking; update count in docs.

#### Questions & Answers

1. **[Assumptions]** leave-data.ts contains 5 domain interfaces (Department, Employee, LeaveType, LeaveRequest, ApprovalConfig) with snake_case fields — zero importers confirmed. Dead code from Supabase era. Delete during migration?
   - Options: Delete dead interfaces during migration | Keep and migrate as-is, clean up later
   - **Answer:** Delete dead interfaces during migration
   - **Rationale:** Reduces noise in shared-reference-data split. Zero consumers = safe delete.

2. **[Architecture]** departments.api.ts only imported by useStore.ts (1 consumer). Where should it live?
   - Options: Keep in features/layout/ | Move to shared/api/ as reference data
   - **Answer:** Keep in features/layout/
   - **Rationale:** Only sidebar uses it currently. Rule of Three — don't extract to shared until 3+ features need it.

3. **[Architecture]** leave-types.api.ts read by multiple features but written only by Config. Should config own the CRUD version?
   - Options: Config owns leave-types, others import via config public API | Duplicate read-only copy in leave-requests
   - **Answer:** Config owns leave-types, others import via config public API
   - **Rationale:** Single source of truth for LeaveTypeDto. Avoids type drift.

4. **[Architecture]** useStore.ts consumed by 10 files. Replace with TanStack Query or split Zustand?
   - Options: Replace with TanStack Query per feature | Split Zustand into per-feature stores
   - **Answer:** Replace with TanStack Query per feature
   - **Rationale:** Better caching, auto-invalidation, proper VSA. More initial work but correct end state.

#### Confirmed Decisions
- Delete dead interfaces from leave-data.ts during Phase 1
- departments.api.ts stays in features/layout/
- Config owns leave-types CRUD; other features import types via config public API
- Replace useStore entirely with TanStack Query hooks per feature

#### Action Items
- [x] Update Phase 1: add step to delete dead interfaces from leave-data.ts
- [x] Update Phase 5: remove leave-types.api.ts from leave-requests; import via config public API
- [x] Update Phase 11: add leave-types.api.ts to config/api/ and re-export LeaveTypeDto from config index.ts
- [x] Update Phase 12: confirm useStore.ts deletion (all 9 consumers migrated to TanStack Query)
- [x] Fix shadcn/ui file count: ~60 → 49 in scout report references
- [x] Fix Zustand exception clause → "entirely TanStack Query, no Zustand stores"
- [x] Fix consumer count: 10 → 9 (AppHeader/AppSidebar don't import useStore)
- [x] Fix scout report: remove leave-types.api.ts from leave-requests target structure
- [x] Fix Phase 6/7/8: clarify LeaveTypeDto import from @/features/config

#### Impact on Phases
- Phase 1: Added dead interface deletion step, fixed file count
- Phase 4: Removed "or" ambiguity — TanStack Query only
- Phase 5: Removed leave-types.api.ts, added config import note
- Phase 6: Added LeaveTypeDto import source clarification
- Phase 7: Added LeaveTypeDto import source clarification
- Phase 8: Added LeaveTypeDto import source clarification
- Phase 11: Added leave-types.api.ts, re-exports LeaveTypeDto
- Phase 12: Fixed consumer count, removed "feature stores" language

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01 through phase-12, scout-report.md (14 files)
- Decision deltas checked: 5
- Reconciled stale references: 12
- Unresolved contradictions: 0
