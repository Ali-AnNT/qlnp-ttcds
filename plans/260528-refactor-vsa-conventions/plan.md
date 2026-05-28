---
title: "Refactor API to VSA Conventions"
description: "Align the .NET API project with Vertical Slice Architecture (dotnet-vsa skill) conventions: file naming, property injection, route groups, Result envelope, folder restructure, and Config domain merge. Codebase is still small (~80 .cs files), making now the ideal time."
status: complete
priority: P1
effort: "3-4 days"
branch: "refactor/adjust-api-arch-follow-vsa-and-fastendpoint"
tags: [refactor, architecture, VSA, FastEndpoints]
blockedBy: []
blocks: []
created: "2026-05-28"
createdBy: "ck:plan"
source: skill
---

# Refactor API to VSA Conventions

## Overview

Refactor `packages/api` to align with Vertical Slice Architecture conventions per the `dotnet-vsa` skill. The codebase is ~80 non-migration .cs files — small enough for a clean, low-risk refactor. Each phase is independently compilable and testable.

## Problem Summary

| # | Problem | VSA Standard | Impact |
|---|---------|-------------|--------|
| 1 | Generic file names (`Endpoint.cs`, `Models.cs`, `Data.cs`) | `{Action}{Role}.cs` (e.g., `CreateLeaveRequestEndpoint.cs`) | Navigation, grep, code review friction |
| 2 | `Data.cs` repo pattern + manual DI registration in Program.cs | Property-inject `AppDbContext` directly in endpoints | 20+ Data classes + 20 manual registrations eliminated |
| 3 | Shared DTOs/mappers/helpers at domain level | Per-action DTOs; shared domain logic in `Shared/Domain/` | Coupling between features |
| 4 | `Entities/`, `Auth/`, `Middleware/` at root | `Shared/Domain/`, `Infrastructure/Auth/`, `Shared/Middleware/` | Inconsistent with VSA 3-tier model |
| 5 | `Config/` + `SystemConfigs/` overlap | Merge into single `SystemConfigs/` domain | Duplicate domains for same entity |
| 6 | `LeaveBalanceService` in `Shared/Services/` | Move to `Shared/Domain/` (domain service) | Wrong tier placement |
| 7 | No Route Groups | `Shared/Groups/` with `Group<T>()` in endpoints | Verbose routes, no shared auth/policies |
| 8 | No `Result<T>` envelope | Consistent `Result<T>` responses | Inconsistent API responses |
| 9 | Constructor injection in endpoints | Property injection (`= null!` pattern) | Non-standard, more boilerplate |

## Target Structure

```
packages/api/
├── Features/
│   ├── Auth/
│   │   └── DevLogin/
│   │   └── Me/
│   ├── LeaveRequests/
│   │   └── {Create,Update,Approve,Reject,Cancel,My,List}/
│   │       ├── {Action}Endpoint.cs
│   │       ├── {Action}Request.cs       (or no request for GET-only)
│   │       ├── {Action}Response.cs       (or shared DTO if Rule of 3)
│   │       └── {Action}Validator.cs
│   ├── LeaveTypes/
│   ├── LeaveBalances/
│   ├── Departments/
│   ├── SystemConfigs/                  ← merged Config + SystemConfigs
│   └── Reports/
├── Shared/
│   ├── Domain/
│   │   ├── LeaveRequest.cs              ← moved from Entities/
│   │   ├── LeaveType.cs
│   │   ├── LeaveBalance.cs
│   │   ├── LeaveConfig.cs
│   │   ├── LeaveRequestAudit.cs
│   │   ├── SystemConfig.cs
│   │   ├── UserMaster.cs
│   │   ├── DmDonvi.cs
│   │   ├── UserRole.cs
│   │   ├── ApprovalHelper.cs           ← moved from Features/LeaveRequests/
│   │   ├── BusinessDayCalculator.cs     ← moved from Features/LeaveRequests/
│   │   └── LeaveBalanceService.cs       ← moved from Shared/Services/
│   ├── Contracts/
│   │   ├── Result.cs                   ← new: Result<T> envelope
│   │   └── PagedData.cs               ← new: paged response
│   ├── Groups/
│   │   ├── LeaveRequestGroup.cs        ← new: route group
│   │   ├── LeaveTypeGroup.cs
│   │   ├── LeaveBalanceGroup.cs
│   │   ├── DepartmentGroup.cs
│   │   └── SystemConfigGroup.cs
│   ├── Processors/                     ← future: logging, timing
│   ├── Middleware/
│   │   └── CurrentUser.cs             ← moved from root Middleware/
│   └── LinqExtension.cs
├── Infrastructure/
│   ├── Auth/
│   │   ├── ICurrentUserProvider.cs     ← moved from Auth/
│   │   ├── CurrentUserProvider.cs
│   │   └── Roles.cs
│   └── Data/
│       ├── AppDbContext.cs
│       ├── AppDbContextFactory.cs
│       └── SeedHelper.cs
└── Program.cs                           ← simplified: no manual Data registrations
```

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Research & Scout](./phase-01-research-scout.md) | Complete |
| 2 | [Folder Restructure & Naming](./phase-02-folder-restructure-naming.md) | Complete |
| 3 | [Eliminate Data Classes](./phase-03-eliminate-data-classes.md) | Complete |
| 4 | [Route Groups & Result Envelope](./phase-04-route-groups-result-envelope.md) | Complete |
| 5 | [Merge Config & Cleanup](./phase-05-merge-config-cleanup.md) | Complete |

## Dependencies

- Phase 2 → Phase 3 (naming must be stable before eliminating Data classes)
- Phase 3 → Phase 4 (property injection must be in place before adding Groups)
- Phase 4 → Phase 5 (Groups need stable before Config merge)
- Phase 1 is independent research — can run in parallel

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Namespace changes break compilation | High | Phase-by-phase: rename → compile → fix → commit |
| `LeaveRequestDto` shared across 6 actions | Medium | Keep as shared in domain until 3+ distinct response types emerge |
| Data class elimination touches 20+ files | High | Phase 3 dedicated to this, with compile checks |
| Route Groups change all API routes | Medium | Group prefix matches current route prefix — zero client impact |

## NOT in Scope

- Rich domain entities (push logic from handlers into entity methods) — future refactor
- Integration test project setup — separate task
- Architecture compliance script (`verify-architecture.sh`) — add after refactor
- `.editorconfig` generation — add after refactor

## Validation Log

### Session 1 — 2026-05-28
**Trigger:** User-requested validation interview
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** File naming convention: VSA descriptive names (`CreateLeaveRequestEndpoint.cs`) vs. FastEndpoints short names (`Endpoint.cs`)?
   - Options: VSA descriptive names | Keep short names
   - **Answer:** VSA descriptive names (Recommended)
   - **Rationale:** Better grep/navigation, aligns with dotnet-vsa skill standard, self-documenting

2. **[Architecture]** Data class elimination approach: Inline into endpoints vs. static extension methods on AppDbContext?
   - Options: Inline into endpoints | Static extensions on DbContext
   - **Answer:** Inline into endpoints (Recommended)
   - **Rationale:** Simplest, truest VSA, eliminates 21 files + 21 DI registrations, handler is the test boundary

3. **[Architecture]** Result<T> implementation: Custom `Result<T>` vs. Ardalis.Result NuGet package?
   - Options: Custom Result<T> | Ardalis.Result NuGet
   - **Answer:** Custom Result<T> (Recommended)
   - **Rationale:** No external dependency, full control, consistent with VSA skill reference code

4. **[Scope]** Config/ and SystemConfigs/ — merge or keep separate?
   - Options: Merge into SystemConfigs | Keep separate domains
   - **Answer:** Merge into SystemConfigs (Recommended)
   - **Rationale:** Same domain (configuration), VSA groups by domain not entity, cleaner structure

#### Confirmed Decisions
- File naming: VSA descriptive `{Action}{Role}.cs` pattern
- Data elimination: Inline all Data methods into endpoint handlers
- Result envelope: Custom `Result<T>` + `PagedData<T>` in `Shared/Contracts/`
- Config merge: Config/ → SystemConfigs/, route changes to `/api/system-configs/leave-configs`

#### Verification Results
- **Tier:** Full (5 phases)
- **Claims checked:** 12
- **Verified:** 12 | **Failed:** 0 | **Unverified:** 0
- 22 endpoints confirmed with `class Endpoint` pattern (all generic names)
- 21 Data classes confirmed (20 instance + 1 static in LeaveBalances/Seed)
- 21 `AddScoped<...Data>()` registrations confirmed in Program.cs
- No Route Groups (`Group<>`) found in codebase — verified new addition
- No `Result<T>` pattern found in codebase — verified new addition
- Config/ and SystemConfigs/ both exist as separate feature folders — verified overlap

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01 through phase-05
- Decision deltas checked: 4
- Reconciled stale references: 0
- Unresolved contradictions: 0