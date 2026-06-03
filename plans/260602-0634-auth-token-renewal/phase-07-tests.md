---
phase: 7
title: "Tests"
status: completed
priority: P2
effort: "1h"
dependencies: [1, 2, 3]
---

# Phase 7: Tests

## Overview

Tạo unit tests cho token-store và token-refresh modules. Cập nhật existing client.test.ts cho key mới.

## Requirements

- Functional: Test tất cả token-store functions
- Functional: Test renewToken và ensureValidToken logic
- Functional: Test API client 401 retry flow
- Functional: Cập nhật existing tests từ `"jwt"` sang `"accessToken"`
- Non-functional: Tests chạy nhanh, mock localStorage/fetch đúng cách

## Architecture

```
token-store.test.ts                  token-refresh.test.ts
├── getAccessToken round-trip        ├── renewToken success
├── getAccessTokenExp parsing        ├── renewToken failure → clearTokens
├── getTokenRenew round-trip         ├── renewToken no token → false
├── setTokens writes all 3           ├── ensureValidToken not expiring → true
├── clearTokens removes all 3        ├── ensureValidToken expiring → calls renew
├── isTokenExpiring with buffer      └── concurrent dedup lock

client.test.ts (updated)
├── "includes Authorization header when accessToken in localStorage"
├── 401 → renew → retry flow
└── proactive refresh when token expiring
```

## Related Code Files

- Create: `packages/web/src/test/token-store.test.ts`
- Create: `packages/web/src/test/token-refresh.test.ts`
- Modify: `packages/web/src/test/client.test.ts`
- Modify: `packages/web/src/test/auth.api.test.ts` (verify no changes needed)

## Implementation Steps

1. **Create `token-store.test.ts`**:
   - `getAccessToken()` / `setTokens()` round-trip: set tokens, verify get returns correct value
   - `getAccessTokenExp()` returns number for valid string, null for missing/NaN
   - `getTokenRenew()` round-trip
   - `setTokens()` writes all 3 keys atomically
   - `clearTokens()` removes all 3 keys
   - `isTokenExpiring()` with 60s buffer: true when within buffer, false when not
   - `isTokenExpired()`: true when past expiry, false when valid, true when no exp

2. **Create `token-refresh.test.ts`**:
   - Mock `renewTokenViaApi` module
   - Mock `token-store` functions
   - `renewToken()` success: verify `setTokens` called with response data, returns true
   - `renewToken()` failure: verify `clearTokens` called, returns false
   - `renewToken()` when no `tokenRenew`: returns false immediately, no fetch
   - `ensureValidToken()` when not expiring: returns true, no fetch called
   - `ensureValidToken()` when expiring: calls `renewToken()`, deduplicates concurrent calls

3. **Update `client.test.ts`**:
   - Change `localStorage.setItem("jwt", "my-token")` → `localStorage.setItem("accessToken", "my-token")`
   - Update test description: "includes Authorization header when accessToken in localStorage"
   - Add test: proactive refresh — mock `isTokenExpiring` to return true, verify `ensureValidToken` called before request
   - Add test: 401 response → verify renew attempt + retry with new token

4. **Verify `auth.api.test.ts`**: No changes needed — `authApi.me()` still calls `api.get("/auth/me")`, unchanged.

5. **Add auth context `storage` event test** (in auth context test or separate file):
   - Simulate `StorageEvent` with `key: "accessToken"` → verify `fetchUser()` called
   - Simulate `StorageEvent` with `key: "accessTokenExp"` → verify `fetchUser()` called
   - Simulate `StorageEvent` with irrelevant key → verify `fetchUser()` NOT called

6. **Add embed session expired interstitial test** (in auth context or login page test):
   - Verify `sessionExpired: true` set when `ensureValidToken()` fails in embed mode
   - Verify interstitial renders "Phiên làm việc đã hết hạn" message
   - Verify auto-redirect after timeout

## Success Criteria

- [ ] Tất cả token-store tests pass
- [ ] Tất cả token-refresh tests pass
- [ ] client.test.ts tests pass với key mới
- [ ] Không còn test nào dùng `"jwt"` key
- [ ] `pnpm test` chạy thành công
- [ ] `pnpm build` không có type errors