---
phase: 3
title: "API Client Refactor"
status: pending
priority: P1
effort: "1h"
dependencies: [1, 2]
---

# Phase 3: API Client Refactor

## Overview

Refactor API client: thay `getJwt()` bằng `getAccessToken()` từ token-store, thêm proactive token refresh trước mỗi request, và 401 retry với refresh-then-retry logic.

## Requirements

- Functional: Đọc `accessToken` từ localStorage key mới thay vì `jwt`
- Functional: Proactive check token expiry trước mỗi API call
- Functional: 401 response → attempt renew → retry request 1 lần
- Functional: Dedup — nhiều concurrent 401 chỉ trigger 1 refresh
- Non-functional: Giữ nguyên API surface (`api.get/post/put/delete`)

## Architecture

```
request<T>(path, options)
  │
  ├── await ensureValidToken()          ← proactive refresh
  │
  ├── getAccessToken() → Bearer header
  │
  ├── fetch(API_URL + path, { ...headers })
  │
  ├── if 401:
  │   ├── await renewToken()            ← reactive refresh
  │   ├── if success → retry request once with new token
  │   └── if failure → clear tokens, return error
  │
  └── else: parse response as before
```

## Related Code Files

- Modify: `packages/web/src/shared/api/client.ts`
- Depends on: `packages/web/src/shared/lib/token-store.ts` (Phase 1)
- Depends on: `packages/web/src/shared/lib/token-refresh.ts` (Phase 2)

## Implementation Steps

1. Remove `getJwt()` function
2. Import `getAccessToken` from `token-store.ts`
3. Import `ensureValidToken` from `token-refresh.ts`
4. Modify `request<T>()`:
   - Add `await ensureValidToken()` at the start
   - Replace `const jwt = getJwt()` with `const token = getAccessToken()`
   - Replace `if (jwt)` with `if (token)` and `Bearer ${jwt}` with `Bearer ${token}`
5. Add 401 handling after fetch:
   ```ts
   if (res.status === 401) {
     const refreshed = await renewToken();
     if (refreshed) {
       // Retry once with new token
       const newToken = getAccessToken();
       const retryHeaders = { ...headers };
       if (newToken) retryHeaders["Authorization"] = `Bearer ${newToken}`;
       const retryRes = await fetch(`${API_URL}${path}`, { ...options, headers: retryHeaders });
       // ... parse retryRes same as normal response
     }
     // If refresh failed, fall through to error handling
   }
   ```
6. Ensure the retry only happens once (not infinite loop on repeated 401)

## Success Criteria

- [ ] `getJwt()` và `localStorage.getItem("jwt")` đã được xóa hoàn toàn
- [ ] Mọi API call đều check `ensureValidToken()` trước
- [ ] 401 response trigger renewToken() rồi retry 1 lần
- [ ] Retry không lặp vô hạn (chỉ 1 lần)
- [ ] API surface (`api.get/post/put/delete`) không thay đổi
- [ ] Concurrent 401 responses chỉ trigger 1 refresh request