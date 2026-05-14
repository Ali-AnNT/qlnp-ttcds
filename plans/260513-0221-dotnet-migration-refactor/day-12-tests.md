---
day: 12
title: Tests
status: planned
priority: P0
effort: 1 day
date: 2026-05-19
---

# Day 12: Tests

## Context Links

- `packages/api/QLNP.Api.csproj`
- `packages/web/vitest.config.ts`
- `packages/web/src/test`

## Overview

Add useful tests for backend endpoint behavior and frontend API/store integration.

## Key Insights

- Current Vitest suite is only a sample.
- API has no test project yet.
- Tests must use real logic, not fake success shortcuts.

## Requirements

- API integration tests for P0 endpoint flows.
- Frontend tests for API client/store behavior.
- Build/test commands documented.

## Architecture

API tests should use `WebApplicationFactory` if practical. DB can use test SQL Server or a clearly documented test fixture.

## Related Code Files

| Action | File |
|--------|------|
| Create | `packages/api.Tests/QLNP.Api.Tests.csproj` or `packages/api/tests` |
| Create | API endpoint test files |
| Modify | `packages/web/src/test/setup.ts` |
| Modify/Create | frontend API/store tests |

## Implementation Steps

1. Add API test project.
2. Test current user middleware/dev fallback.
3. Test leave type CRUD authorization.
4. Test leave request create overlap rejection.
5. Test approval state transition and balance update.
6. Update Vitest setup to mock API client only where unit tests require isolation.
7. Run API and web tests.

## Todo List

- [ ] API test project.
- [ ] Auth/me tests.
- [ ] LeaveTypes tests.
- [ ] LeaveRequests approval tests.
- [ ] Vitest API/store tests.
- [ ] Document any unavoidable external DB requirement.

## Success Criteria

- `dotnet test` passes for API test project.
- `pnpm --dir packages/web test` passes.
- Failures are fixed, not ignored.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Test DB unavailable | Use explicit fixture strategy and document setup |
| Tests become too broad | Cover P0 workflows only first |

## Security Considerations

- Test unauthorized access and role boundaries.

## Next Steps

- Sync docs and deployment instructions.
