---
day: 4
title: Middleware and VSA Folders
status: completed
priority: P0
effort: 0.5 day
date: 2026-05-13
---

# Day 4: Middleware and VSA Folders

## Context Links

- `packages/api/Middleware/CurrentUserMiddleware.cs`
- `packages/api/Features`
- `docs/system-architecture.md`

## Overview

Add gateway current-user middleware and scaffold VSA folders for endpoint work.

## Key Insights

- Production auth comes from gateway headers.
- Dev fallback is allowed only for local/dev.
- Folders exist, but endpoint classes are still missing.

## Requirements

- Resolve current user into `HttpContext.Items`.
- Use configurable gateway headers.
- Scaffold feature/action folders.

## Architecture

Request -> `CurrentUserMiddleware` -> FastEndpoints endpoint -> EF Core.

## Related Code Files

| Action | File |
|--------|------|
| Created | `packages/api/Middleware/CurrentUser.cs` |
| Created | `packages/api/Middleware/CurrentUserMiddleware.cs` |
| Created | `packages/api/Features/**` folders |
| Modified | `packages/api/Program.cs` |

## Implementation Steps

1. Define `CurrentUser` record.
2. Read gateway headers.
3. Lookup `USER_MASTER` and `UserRoles`.
4. Store current user in `HttpContext.Items`.
5. Add VSA folders for Auth, LeaveTypes, LeaveRequests, LeaveBalances, Config.

## Todo List

- [x] Middleware exists.
- [x] Middleware registered.
- [x] Feature folders scaffolded.
- [ ] Add middleware tests during Day 12.

## Success Criteria

- Middleware can resolve user in dev mode.
- Endpoint implementation can read current user consistently.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Header contract changes | Keep names configurable and confirm with host team |

## Security Considerations

- Dev fallback must be disabled in production.
- Do not trust user IDs from browser directly; headers must come from trusted gateway.

## Next Steps

- Refactor frontend API layer.
