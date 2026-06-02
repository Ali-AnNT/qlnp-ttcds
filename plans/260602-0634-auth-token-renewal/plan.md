---
title: "Auth Token Storage & Renewal"
description: "Refactor auth system từ jwt+postMessage sang accessToken/accessTokenExp/tokenRenew localStorage flow với auto-renew"
status: pending
priority: P1
branch: "dev"
tags: [auth, frontend, token-renewal]
blockedBy: []
blocks: []
created: "2026-06-02T06:34:41.383Z"
createdBy: "ck:plan"
source: skill
---

# Auth Token Storage & Renewal

## Overview

Hệ thống auth hiện tại dùng `localStorage.getItem("jwt")` + `postMessage` iframe flow. Khi tích hợp vào website khác (production), app nhận sẵn 3 key trên localStorage: `accessToken`, `accessTokenExp`, `tokenRenew`. Cần refactor để:

- Đọc `accessToken` thay vì `jwt`
- Check `accessTokenExp` trước mỗi API call, tự renew khi sắp hết hạn
- Dùng `tokenRenew` (refresh token) gọi external auth API để lấy token mới
- Embed mode: không cho logout, parent quản lý lifecycle
- **Thay thế hoàn toàn** flow cũ (`jwt` key + `postMessage`)

**Không thay đổi backend.** Tất cả thay đổi chỉ ở frontend.

## Context

### Current Flow
```
Dev: LoginPage → POST /auth/dev-login → jwt → localStorage("jwt")
Embed: parent postMessage({type:"auth",token}) → localStorage("jwt") → fetchUser()
API: getJwt() → Bearer header → no 401 handling, no refresh
```

### New Flow
```
Production: parent site sets accessToken/accessTokenExp/tokenRenew on localStorage
App init: check accessTokenExp → if expiring → renewToken(tokenRenew) → fetchUser()
API calls: ensureValidToken() → if expiring → auto-renew → Bearer header
401 response: attempt renew → retry once
Embed: no logout button, parent manages lifecycle
Dev: same dev-login but stores in accessToken key
Storage event: listen for external token changes → refetch user
```

**`storage` event listener**: Khi parent site thay đổi token (renew/logout), `StorageEvent` fire → app refetch user. Chỉ hoạt động khi thay đổi từ context khác (tab/iframe khác) — đúng cho embed use case. Không cần postMessage.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Token Store Module](./phase-01-token-store-module.md) | Pending |
| 2 | [Auth Renew API & Refresh Logic](./phase-02-auth-renew-api-refresh-logic.md) | Pending |
| 3 | [API Client Refactor](./phase-03-api-client-refactor.md) | Pending |
| 4 | [Auth Context Refactor](./phase-04-auth-context-refactor.md) | Pending |
| 5 | [Login Page & Sidebar Update](./phase-05-login-page-sidebar-update.md) | Pending |
| 6 | [Env Config & Types](./phase-06-env-config-types.md) | Pending |
| 7 | [Tests](./phase-07-tests.md) | Pending |

## Dependencies

- Phase 2 depends on Phase 1 (token-store)
- Phase 3 depends on Phase 1 + 2 (token-store + token-refresh)
- Phase 4 depends on Phase 1 + 2 + 3
- Phase 5 depends on Phase 4
- Phase 6 is independent (can be done anytime)
- Phase 7 depends on Phase 1-3

## File Summary

| Action | File |
|--------|------|
| CREATE | `packages/web/src/shared/lib/token-store.ts` |
| CREATE | `packages/web/src/shared/lib/auth-renew.api.ts` |
| CREATE | `packages/web/src/shared/lib/token-refresh.ts` |
| CREATE | `packages/web/src/test/token-store.test.ts` |
| CREATE | `packages/web/src/test/token-refresh.test.ts` |
| MODIFY | `packages/web/src/shared/api/client.ts` |
| MODIFY | `packages/web/src/features/auth/contexts/auth-context.tsx` |
| MODIFY | `packages/web/src/features/auth/components/login-page.tsx` |
| MODIFY | `packages/web/src/features/layout/components/app-sidebar.tsx` |
| MODIFY | `.env.example` |
| MODIFY | `packages/web/src/vite-env.d.ts` |
| MODIFY | `packages/web/src/test/client.test.ts` |

## Verification

1. `pnpm dev` — dev login dropdown → store accessToken → fetch /auth/me
2. Embed mode: set accessToken/accessTokenExp/tokenRenew manually → app loads user
3. Token expiry: set accessTokenExp to past → triggers renew call
4. 401 retry: mock 401 → verify renew + retry
5. Sidebar: embed mode hides logout, dev mode shows logout
6. **Storage event**: change accessToken from dev tools → app refetches user
7. `pnpm test` — all tests pass
8. `pnpm build` — no compile errors

## Open Questions

1. **External renew API request/response shape**: assumed OAuth2-like `POST { refresh_token }` returning `{ accessToken, accessTokenExp, tokenRenew }`. Must confirm with external auth service team.
2. **tokenRenew value in dev mode**: empty string — `renewToken()` returns false immediately, which is desired (dev mode uses dev-login which creates 8h JWT, no renewal needed).
3. **Error UI for session expiry in embed**: plan currently clears tokens + AuthGuard redirects to /login which shows "access from main app" message. No interstitial.