---
day: 6
phase: Auth + Store Refactor
status: pending
effort: 1 day
priority: P1
---

# Day 6: AuthContext JWT + Refactor Zustand Store

## Context

**Depends on:** Day 5 (API layer sẵn sàng)

## Overview

Tạo AuthContext quản lý JWT token + user state, refactor Zustand store từ Supabase sang API calls.

## Tasks

### 6.1 AuthContext

- [ ] `src/auth/auth-context.tsx`
  - State: `user`, `token`, `isLoading`, `isEmbedded`
  - `login(username, password)` — gọi `authApi.login()`, lưu token, set user
  - `logout()` — xóa token, xóa user
  - `init()` — detect embed mode → gọi `authApi.getMe()` không cần token (gateway forwards)
  - Standalone: check localStorage token, verify với `authApi.getMe()`
  - Embed mode detection: `window.self !== window.top` hoặc query param `?embed=1`

- [ ] `src/auth/AuthProvider.tsx` — wrap app, gọi `init()` on mount

### 6.2 Refactor Zustand Store

- [ ] `src/store/useStore.ts` — viết lại:
  - **Xóa** tất cả Supabase imports
  - **Xóa** `login()` / `logout()` — chuyển sang AuthContext
  - **Giữ** state: departments, employees, leaveTypes, leaveRequests, approvalConfigs
  - `loadData()` — gọi API modules thay vì supabase:
    ```ts
    const [departments, employees, leaveTypes, configs] = await Promise.all([
      departmentApi.getAll(),
      employeeApi.getAll(),
      leaveTypeApi.getAll(),
      configApi.getAll(),
    ]);
    // leave requests with role-based filtering on server
    const leaveRequests = await leaveRequestApi.getAll({ /* no filter, server handles by JWT */ });
    ```
  - `addLeaveRequest(req)` — gọi `leaveRequestApi.create(req)`
  - `updateLeaveRequest(id, updates)` — gọi `leaveRequestApi.update(id, updates)` hoặc approve/reject/cancel

### 6.3 Update App.tsx

- [ ] Wrap app với `<AuthProvider>`
- [ ] AuthGuard check `useAuth()` thay vì `useStore(s => s.currentUser)`
- [ ] Redirect flow giữ nguyên

### 6.4 Role-based API Call Mapping

- [ ] Store không cần filter theo role nữa — server handles dựa trên JWT
- [ ] Chỉ giữ local state cache, không duplicate business logic

## Delivery

- [ ] App load → AuthProvider init → verify token → set user or redirect login
- [ ] Login flow end-to-end với backend thật
- [ ] Store.loadData() lấy được data từ API

## Files to Create

| File | Purpose |
|------|---------|
| `src/auth/auth-context.tsx` | Auth context + provider |
| `src/store/useStore.ts` (refactor) | Remove Supabase, use API |
| `src/App.tsx` (update) | Add AuthProvider |

## Files to Delete

| File | Reason |
|------|--------|
| `src/integrations/supabase/client.ts` | No longer needed |
| `src/integrations/supabase/types.ts` | No longer needed |
