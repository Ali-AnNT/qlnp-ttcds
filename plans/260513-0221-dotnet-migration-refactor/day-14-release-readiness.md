---
day: 14
title: Release Readiness
status: planned
priority: P0
effort: 1 day
date: 2026-05-21
---

# Day 14: Release Readiness

## Context Links

- `plans/260513-0221-dotnet-migration-refactor/plan.md`
- `docs/project-roadmap.md`
- `docs/project-changelog.md`

## Overview

Run final validation before treating the migration as ready for PR/release.

## Key Insights

- Release readiness requires build, tests, manual smoke, and docs consistency.
- Do not mark complete if endpoint or auth integration is incomplete.

## Requirements

- API build/test pass.
- Web build/test pass.
- Manual smoke flow passes.
- Docs and roadmap reflect actual state.

## Architecture

Validate whole path: host/dev auth -> React -> API -> EF Core -> SQL Server.

## Related Code Files

| Action | File |
|--------|------|
| Read/Verify | `packages/api/**` |
| Read/Verify | `packages/web/**` |
| Modify if needed | `docs/project-roadmap.md` |
| Modify if needed | `docs/project-changelog.md` |

## Implementation Steps

1. Run `dotnet build packages/api/QLNP.Api.csproj`.
2. Run API tests.
3. Run `pnpm --dir packages/web build`.
4. Run `pnpm --dir packages/web test`.
5. Manual smoke:
   - resolve current user
   - list leave types
   - create leave request
   - approve/reject/cancel
   - view calendar/summary/report/violations
   - update config as QTHT
6. Review docs and plan status.
7. Prepare final review notes.

## Todo List

- [ ] API build pass.
- [ ] API tests pass.
- [ ] Web build pass.
- [ ] Web tests pass.
- [ ] Manual smoke pass.
- [ ] Docs synced.
- [ ] Release notes ready.

## Success Criteria

- No known P0 blockers remain.
- All acceptance criteria in `plan.md` are checked or explicitly blocked.
- Project can move to PR/release.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Late integration failure | Fix P0 only; defer non-critical enhancements |

## Security Considerations

- Re-check no secrets in git.
- Verify production dev fallback is disabled.
- Verify unauthorized role actions fail.

## Next Steps

- Commit with conventional message after user asks.
