---
phase: 2
title: "Auth Renew API & Refresh Logic"
status: pending
priority: P1
effort: "1h"
dependencies: [1]
---

# Phase 2: Auth Renew API & Refresh Logic

## Overview

Tạo 2 modules: (1) raw fetch wrapper gọi external auth renew endpoint, (2) token refresh logic với dedup lock để nhiều API calls concurrent chỉ trigger 1 refresh.

## Requirements

- Functional: Gọi external auth API với `tokenRenew` để lấy accessToken mới
- Functional: `ensureValidToken()` proactively check expiry trước mỗi API call
- Functional: Dedup — nhiều concurrent calls chỉ trigger 1 refresh request
- Non-functional: `auth-renew.api.ts` là thin fetch wrapper, dễ mock khi test
- Non-functional: `token-refresh.ts` chứa business logic, testable với mock

## Architecture

```
auth-renew.api.ts (shared/lib)     token-refresh.ts (shared/lib)
  ├── RenewResponse interface        ├── renewToken(): Promise<boolean>
  └── renewTokenViaApi()                ├── read tokenRenew from store
      ├── POST VITE_AUTH_RENEW_URL      ├── call renewTokenViaApi()
      ├── body: { refresh_token }       ├── on success: setTokens()
      └── return RenewResponse|null     └── on failure: clearTokens(), return false
                                     ├── ensureValidToken(): Promise<boolean>
                                     │   ├── if not expiring → return !!accessToken
                                     │   └── if expiring → call renewToken() (dedup)
                                     └── refreshPromise (module-level lock)
```

**RenewResponse interface** (adjust khi biết exact API spec):
```ts
interface RenewResponse {
  accessToken: string;
  accessTokenExp: number;   // epoch ms
  tokenRenew: string;
}
```

## Related Code Files

- Create: `packages/web/src/shared/lib/auth-renew.api.ts`
- Create: `packages/web/src/shared/lib/token-refresh.ts`
- Depends on: `packages/web/src/shared/lib/token-store.ts` (Phase 1)

## Implementation Steps

1. Create `auth-renew.api.ts`:
   - Define `RenewResponse` interface
   - Implement `renewTokenViaApi(tokenRenew: string)` — POST to `import.meta.env.VITE_AUTH_RENEW_URL`
   - Request body: `{ refresh_token: tokenRenew }` (adjust to match external API)
   - On success: parse response, return `RenewResponse`
   - On failure: return null

2. Create `token-refresh.ts`:
   - Import from `token-store.ts`: `getAccessToken`, `getTokenRenew`, `setTokens`, `clearTokens`, `isTokenExpiring`
   - Import from `auth-renew.api.ts`: `renewTokenViaApi`
   - Implement `renewToken()`:
     - Read `tokenRenew` from store
     - If falsy, return false immediately (dev mode has empty string)
     - Call `renewTokenViaApi(tokenRenew)`
     - On success: `setTokens(response.accessToken, response.accessTokenExp, response.tokenRenew)`, return true
     - On failure: `clearTokens()`, return false
   - Implement `ensureValidToken()`:
     - If not expiring: return `!!getAccessToken()`
     - If expiring: use `refreshPromise` dedup lock
     - Multiple concurrent callers share one in-flight `renewToken()` call
     - Return whether we have valid accessToken after attempt

3. Dedup lock pattern:
   ```ts
   let refreshPromise: Promise<boolean> | null = null;
   // In ensureValidToken:
   if (!refreshPromise) {
     refreshPromise = renewToken().finally(() => { refreshPromise = null; });
   }
   return refreshPromise;
   ```

## Success Criteria

- [ ] `renewTokenViaApi` gọi đúng endpoint với body `{ refresh_token }`
- [ ] `renewToken` đọc tokenRenew, gọi API, setTokens on success, clearTokens on failure
- [ ] `renewToken` return false ngay khi không có tokenRenew
- [ ] `ensureValidToken` không gọi renew khi token chưa expiring
- [ ] `ensureValidToken` gọi renew khi token expiring, dedup concurrent calls
- [ ] Không import React dependency