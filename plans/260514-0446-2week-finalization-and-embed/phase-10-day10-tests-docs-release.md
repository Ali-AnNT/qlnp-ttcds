---
phase: 10
title: "Day 10 — Unit Tests + Docs + Release"
status: pending
priority: P1
effort: "1d"
dependencies: [9]
---

# Phase 10: Day 10 — Unit Tests + Docs + Release

## Overview

Write comprehensive unit tests, update project documentation, and prepare for release.

## Unit Tests

### Backend (.NET)
- `packages/api.Tests/` — integration tests with TestServer + InMemory DB
- Auth/Me endpoint tests
- LeaveRequests state machine tests (all transitions)
- LeaveTypes CRUD tests
- LeaveBalances query tests
- Role-based authorization tests

### Frontend (Vitest)
- `packages/web/src/test/` — API client + store tests
- auth.api.test.ts (exists, 1 test)
- client.test.ts (exists, 5 tests)
- leave-types.api.test.ts (exists, 5 tests)
- useStore.test.ts (exists, 3 tests)
- Add: leave-requests.api.test.ts, config.api.test.ts

## Documentation Updates

- Update `docs/system-architecture.md` with .NET API architecture
- Update `docs/code-standards.md` with VSP + FastEndpoints patterns
- Update `docs/development-roadmap.md` progress
- Update `docs/project-changelog.md` with migration changes

## Release

- Merge `toanhv/add-apis-for-qlnp` → `dev` (per branch flow rule)
- Tag release version
- Verify production readiness

## Success Criteria

- [ ] Backend tests pass (integration)
- [ ] Frontend tests pass (14+ tests)
- [ ] Docs updated and accurate
- [ ] Branch merged to dev via PR
- [ ] No regressions on dev branch