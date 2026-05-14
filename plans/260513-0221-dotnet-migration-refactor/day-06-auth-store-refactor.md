---
day: 6
title: Auth and Store Refactor
status: done-verify-pending
priority: P1
effort: 0.5 day
date: 2026-05-13
---

# Day 6: Auth and Store Refactor

## Context Links

- `packages/web/src/contexts/AuthContext.tsx`
- `packages/web/src/store/useStore.ts`
- `packages/web/src/App.tsx`

## Overview

Move auth state out of Zustand and into `AuthContext`. Zustand remains data cache/actions only.

## Key Insights

- Auth is SSO/gateway-oriented.
- Login form should not reappear.
- Server owns role filtering.

## Requirements

- AuthContext resolves current user via API.
- Store calls API modules for data.
- Pages read auth user from `useAuth()`.

## Architecture

`AuthProvider` wraps app -> store loads domain data -> pages render by role.

## Related Code Files

| Action | File |
|--------|------|
| Modified | `packages/web/src/contexts/AuthContext.tsx` |
| Modified | `packages/web/src/store/useStore.ts` |
| Modified | `packages/web/src/App.tsx` |
| Modified | `packages/web/src/pages/LoginPage.tsx` |

## Implementation Steps

1. Initialize auth from local state/postMessage/dev mode.
2. Call `/api/auth/me`.
3. Store current user in AuthContext.
4. Remove auth mutations from Zustand.
5. Keep store data actions thin.

## Todo List

- [x] AuthContext exists.
- [x] Store no longer owns auth.
- [ ] Verify auth flow with real `MeEndpoint`.
- [ ] Verify logout/postMessage behavior with host.

## Success Criteria

- App redirects or waits when current user is unresolved.
- Store can load data after auth is resolved.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Auth race with data loading | Gate data loading behind resolved user |

## Security Considerations

- Clear token/state on logout.
- Never trust role from client for authorization.

## Next Steps

- Validate page refactors.
