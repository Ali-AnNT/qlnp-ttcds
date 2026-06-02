---
phase: 4
title: "Auth Context Refactor"
status: pending
priority: P1
effort: "1h"
dependencies: [1, 2, 3]
---

# Phase 4: Auth Context Refactor

## Overview

Refactor AuthProvider: xóa postMessage flow, thêm `ensureValidToken()` trước `fetchUser()`, thêm `logout` function vào context state. Embed mode detect giữ nguyên.

## Requirements

- Functional: Xóa hoàn toàn postMessage event listener
- Functional: Trước khi gọi fetchUser(), gọi ensureValidToken() để check/refresh token
- Functional: Thêm `logout` function vào AuthState context
- Functional: `logout` trong embed mode là no-op (không xóa token, không redirect)
- Functional: `logout` trong dev mode gọi clearTokens() + redirect `/login`
- Functional: `storage` event listener refetch user khi parent site thay đổi accessToken/accessTokenExp/tokenRenew
- Non-functional: AuthState interface mở rộng, không breaking change cho consumers

## Architecture

```
AuthProvider (mount)
  │
  ├── detect isEmbed: window.self !== window.top
  │
  ├── await ensureValidToken()
  │   ├── if valid → fetchUser()
  │   └── if invalid → setState({ user: null, loading: false })
  │
  └── [REMOVED] postMessage listener
  │
  └── [NEW] storage event listener → refetch user on external token change

AuthState {
  user: AuthUser | null
  loading: boolean
  isEmbed: boolean
  logout: () => void       ← NEW
}

logout():
  ├── if isEmbed → no-op (parent manages lifecycle)
  └── if !isEmbed → clearTokens() + redirect /login
```

## Related Code Files

- Modify: `packages/web/src/features/auth/contexts/auth-context.tsx`
- Modify: `packages/web/src/features/auth/hooks/use-auth.ts` (re-export unchanged, verify)
- Depends on: `packages/web/src/shared/lib/token-store.ts` (Phase 1)
- Depends on: `packages/web/src/shared/lib/token-refresh.ts` (Phase 2)

## Implementation Steps

1. Remove entire postMessage event listener and its handler
2. Remove `localStorage.setItem("jwt", event.data.token)`
3. Add import: `ensureValidToken` from `token-refresh.ts`, `clearTokens` from `token-store.ts`
4. Update `AuthState` interface to include `logout: () => void`
5. Update `AuthContext` default value to include `logout: () => {}`
6. Implement `logout` callback:
   ```ts
   const logout = useCallback(() => {
     if (window.self !== window.top) return; // no-op in embed
     clearTokens();
     window.location.href = "/login";
   }, []);
   ```
7. Update `useEffect` to call `ensureValidToken()` before `fetchUser()`:
   ```ts
   useEffect(() => {
     const init = async () => {
       const valid = await ensureValidToken();
       if (valid) {
         await fetchUser();
       } else {
         setState({ user: null, loading: false, isEmbed: window.self !== window.top, logout });
       }
     };
     init();
   }, []);
   ```
8. Remove `fetchUser` from useEffect dependency array (it's now called inside async init)
9. Keep `isEmbed` detection via `window.self !== window.top`
10. Update `setState` calls to always include `logout` in state
11. **Add `storage` event listener** — khi parent site thay đổi token (renew/logout):
    ```ts
    useEffect(() => {
      const handler = (e: StorageEvent) => {
        if (e.key === "accessToken" || e.key === "accessTokenExp" || e.key === "tokenRenew") {
          // Token changed by parent site → refetch user with new token
          fetchUser();
        }
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }, [fetchUser]);
    ```
    - `StorageEvent` chỉ fire khi thay đổi từ **context khác** (tab/iframe khác) — OK cho embed use case
    - Khi parent renew → app refetch user với token mới
    - Khi parent logout (clear token) → fetchUser fail → AuthGuard redirect

## Success Criteria

- [ ] postMessage listener đã được xóa hoàn toàn
- [ ] `localStorage.setItem("jwt", ...)` không còn trong file
- [ ] `ensureValidToken()` được gọi trước `fetchUser()`
- [ ] `logout` function có trong AuthState context
- [ ] `logout` trong embed mode là no-op
- [ ] `logout` trong dev mode clearTokens + redirect
- [ ] `storage` event listener refetch user khi parent thay đổi token
- [ ] `useAuth()` hook vẫn hoạt động bình thường