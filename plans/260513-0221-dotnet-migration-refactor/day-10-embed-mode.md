---
day: 10
phase: Embed Mode
status: pending
effort: 1 day
priority: P2
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - plans/260513-0221-dotnet-migration-refactor/plan.md
---

# Day 10: Standalone Embedding + Remove Supabase

## Context

**Depends on:** Day 9 (all pages refactored)
**Decision:** Dual-issuer JWT: host JWT (RS256) → frontend gửi qua POST /api/auth/exchange → nhận app JWT (HS256). BE validate host JWT bằng public key (configured in appsettings).

## Embed Auth Flow

```
Host Website                    React App (iframe)              .NET API
    │                                │                              │
    ├── postMessage({                  │                              │
    │   type: "auth",                  │                              │
    │   token: "<hostJWT>"             │                              │
    │ }) ─────────────────────────►    │                              │
    │                                │                              │
    │                                ├── POST /api/auth/exchange ───►│
    │                                │   { hostToken: "<hostJWT>" }  │
    │                                │                              ├── Validate RS256 signature
    │                                │                              ├── Extract employeeId
    │                                │                              ├── Query employee
    │                                │                              └── Generate app JWT (HS256)
    │                                │◄── { token: "<appJWT>", user }│
    │                                │                              │
    │                                ├── AuthContext.setToken()
    │                                ├── GET /api/auth/me ─────────►│
    │                                │◄── user info ────────────────│
    │                                │                              │
    │◄── postMessage({                │                              │
    │   type: "APP_READY"             │                              │
    │ }) ──────────────────────────   │                              │
```

## Tasks

### 10.1 Embed Detection + Token Exchange

- [ ] `src/auth/auth-context.tsx` bổ sung:
  - Detect iframe: `window.self !== window.top` hoặc query param `?embed=1`
  - `isEmbedded` state → ẩn login page
  - `postMessage` listener nhận `{ type: "auth", token: string }` từ host
  - Khi nhận host JWT → gọi `authApi.exchangeToken(hostToken)`:
    ```ts
    // auth-api.ts bổ sung:
    exchangeToken(hostToken: string): Promise<{token: string, user: AuthUser}>
    ```
  - Nhận app JWT → `setToken()` → `getMe()` → dashboard
  - Nếu host gửi `{ type: "logout" }` → gọi `logout()`

### 10.2 postMessage Bridge

- [ ] `src/auth/host-bridge.ts`:
  - **Host → App messages:**
    - `{ type: "auth", token: "<hostJWT>" }` — host cung cấp JWT
    - `{ type: "logout" }` — host yêu cầu logout
  - **App → Host messages:**
    - `{ type: "APP_READY" }` — app đã init xong
    - `{ type: "NAVIGATE", path: string }` — thông báo navigation
    - `{ type: "RESIZE", height: number }` — yêu cầu resize iframe
  - `postMessage` target origin: configurable (`VITE_HOST_ORIGIN`)

### 10.3 Dynamic Iframe Height

- [ ] `src/hooks/use-iframe-resize.ts`
  - ResizeObserver trên body height
  - Gửi `RESIZE` message lên parent
  - Debounce 200ms
  - Chỉ active khi `isEmbedded = true`

### 10.4 Exchange API Client

- [ ] `src/api/auth-api.ts` bổ sung:
  ```ts
  exchangeToken(hostToken: string): Promise<{token: string; user: AuthUser}> {
      return post('/api/auth/exchange', { hostToken });
  }
  ```

### 10.5 Remove Supabase Completely

- [ ] Gỡ package: `pnpm remove @supabase/supabase-js`
- [ ] Xóa thư mục `src/integrations/supabase/`
- [ ] Xóa `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` khỏi `.env`
- [ ] Thêm `VITE_API_URL`, `VITE_HOST_ORIGIN` vào `.env.example`
- [ ] Chạy `pnpm build` kiểm tra không còn reference đến supabase

### 10.6 Update Index.html for Embed

- [ ] `index.html` — thêm CSP meta tag cho embed mode
- [ ] CSS: body không margin/padding khi embed (class `embed-mode`)

## Delivery

- [ ] App chạy standalone: login → JWT → hoạt động bình thường
- [ ] App chạy trong iframe: host gửi postMessage → AuthContext nhận → exchange token → API calls thành công
- [ ] App gửi APP_READY, NAVIGATE, RESIZE messages lên host
- [ ] `pnpm build` không lỗi, không reference Supabase
- [ ] Test flow: host page → iframe load → auth → dashboard

## Files to Create

| File | Purpose |
|------|---------|
| `src/auth/host-bridge.ts` | postMessage bridge (auth, navigate, resize) |
| `src/hooks/use-iframe-resize.ts` | Dynamic iframe resize |

## Files to Modify

| File | Changes |
|------|---------|
| `src/auth/auth-context.tsx` | Embed detection + exchange token flow |
| `src/api/auth-api.ts` | Add `exchangeToken()` method |
| `index.html` | CSP meta tags for embed |
| `.env.example` | Replace Supabase with VITE_API_URL + VITE_HOST_ORIGIN |
