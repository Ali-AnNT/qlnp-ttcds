---
phase: 1
title: "Token Store Module"
status: pending
priority: P1
effort: "30m"
dependencies: []
---

# Phase 1: Token Store Module

## Overview

Tạo module quản lý tất cả localStorage interactions cho auth tokens. Không file nào khác được đọc/ghi trực tiếp localStorage cho auth tokens — tất cả phải qua module này.

## Requirements

- Functional: Quản lý 3 key `accessToken`, `accessTokenExp`, `tokenRenew` trên localStorage
- Functional: Cung cấp helper kiểm tra token sắp hết hạn / đã hết hạn
- Non-functional: Zero React dependencies — module thuần TS, dễ unit test

## Architecture

Module là tập hợp các pure functions đọc/ghi localStorage. Không side effects ngoài localStorage.

```
token-store.ts
  ├── getAccessToken() → string | null
  ├── getAccessTokenExp() → number | null (epoch ms)
  ├── getTokenRenew() → string | null
  ├── setTokens(access, exp, renew) → void
  ├── clearTokens() → void
  ├── isTokenExpiring(bufferMs = 60000) → boolean
  └── isTokenExpired() → boolean
```

## Related Code Files

- Create: `packages/web/src/shared/lib/token-store.ts`
- Replace usages in: `packages/web/src/shared/api/client.ts` (getJwt → getAccessToken)
- Replace usages in: `packages/web/src/features/auth/components/login-page.tsx` (localStorage.setItem("jwt"))
- Replace usages in: `packages/web/src/features/auth/contexts/auth-context.tsx` (localStorage.setItem("jwt"))
- Replace usages in: `packages/web/src/features/layout/components/app-sidebar.tsx` (localStorage.removeItem("jwt"))

## Implementation Steps

1. Create `packages/web/src/shared/lib/token-store.ts`
2. Implement `getAccessToken()` — `localStorage.getItem("accessToken")`
3. Implement `getAccessTokenExp()` — parse `localStorage.getItem("accessTokenExp")` to number, return null if missing/NaN
4. Implement `getTokenRenew()` — `localStorage.getItem("tokenRenew")`
5. Implement `setTokens(access: string, exp: number, renew: string)` — writes all 3 keys atomically
6. Implement `clearTokens()` — removes all 3 keys with `removeItem`
7. Implement `isTokenExpiring(bufferMs = 60000)` — true if no exp OR `Date.now() >= exp - bufferMs`
8. Implement `isTokenExpired()` — true if no exp OR `Date.now() >= exp`

## Success Criteria

- [ ] Tất cả functions đọc/ghi đúng localStorage keys
- [ ] `isTokenExpiring` trả về true khi exp trong vòng 60s
- [ ] `isTokenExpired` trả về true khi exp đã qua
- [ ] `clearTokens` xóa cả 3 keys
- [ ] Module không import React hoặc bất kỳ UI dependency nào