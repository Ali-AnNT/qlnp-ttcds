# .NET 9 FastEndpoints + EF Core Migration Rebaseline (Superseded)

**Date**: 2026-05-20
**Severity**: Medium
**Component**: Full-stack: API (FastEndpoints/EF Core), Frontend (React/Vite), Auth (Gateway SSO)
**Status**: Superseded at 80%

## What Happened

This was the initial 14-day plan to rebaseline the old Dapper/standalone-login codebase onto .NET 9, FastEndpoints, EF Core 9, and gateway/SSO auth. We reached Day 11 before the approach was refined into a more specific scaffold-first plan (`260513-0554-efcore-scaffold-migration`). The remaining 20% (runtime verification, tests, docs) was never executed under this plan.

## The Brutal Truth

This plan was too broad. It tried to do the entire migration in one shot -- backend scaffold, frontend refactor, auth rewrite, deployment config, tests, docs -- all under a single 14-day umbrella. By Day 11 we realized the EF Core migration scaffolding itself needed its own focused plan. The monolithic approach meant we had 10 unchecked verification items from Days 05-08 dangling with no clear owner, and no test DB to validate runtime correctness.

## Technical Details

- 80% progress across 11 of 14 days
- All backend endpoints implemented: Auth/Me, LeaveTypes CRUD, LeaveRequests (List/Create/Update/Approve/Reject/Cancel/My), Config (GET/PUT), UserRole, LeaveBalances, Departments
- Frontend-backend DTO alignment completed, both API and web builds at 0 errors
- Key decisions locked in: EF Core over Dapper, gateway/SSO over standalone login, existing USER_MASTER/DM_DONVI tables preserved
- Superseded by `plans/260513-0554-efcore-scaffold-migration/`

## What We Tried

A monolithic 14-day plan covering all layers simultaneously. Days 1-4 (scaffold + entities) were clean. Days 5-8 (frontend) accumulated verification debt. Days 9-10 (backend endpoints) delivered well. Day 11 revealed the runtime test gap and stalled progress.

## Root Cause Analysis

The plan scope was correct for a high-level roadmap but wrong for execution granularity. The EF Core migration, as the foundational piece, needed its own plan with defined deliverables before layering frontend work on top. Mixing scaffold + frontend + auth in one plan created dependency tangles where one area's blockers (e.g., no test DB) cascaded across all remaining days.

## Lessons Learned

- Break foundational work (scaffolding, migration) into its own plan before layering frontend changes.
- Every plan needs a defined runtime verification strategy from Day 1, not deferred to "later days."
- 10 unchecked verification items signal scope sprawl -- stop and split the plan.

## Next Steps

Already executed: `plans/260513-0554-efcore-scaffold-migration` picks up the EF Core scaffold with a narrower, verifiable scope. The code delivered by this plan (all endpoints, DTO alignment) was retained in the branch.
