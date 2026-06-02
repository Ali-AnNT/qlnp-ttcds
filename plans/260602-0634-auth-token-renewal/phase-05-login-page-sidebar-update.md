---
phase: 5
title: "Login Page & Sidebar Update"
status: pending
priority: P2
effort: "45m"
dependencies: [4]
---

# Phase 5: Login Page & Sidebar Update

## Overview

Cập nhật LoginPage: dev login dùng `setTokens()` thay vì `localStorage.setItem("jwt")`, xóa postMessage waiting UI. Cập nhật AppSidebar: ẩn logout button trong embed mode, dùng `logout()` từ context.

## Requirements

- Functional: Dev login store token qua `setTokens()` với key mới
- Functional: Xóa postMessage waiting UI ("Đang chờ xác thực")
- Functional: Embed mode (no token) → hiện message "Không tìm thấy phiên làm việc hợp lệ"
- Functional: Sidebar ẩn logout button khi `isEmbed === true`
- Non-functional: Giữ nguyên UI layout, chỉ thay đổi logic

## Architecture

### Login Page Flow (sau refactor)
```
loading + !user → spinner
isEmbed → "Không tìm thấy phiên làm việc hợp lệ. Vui lòng truy cập từ ứng dụng chính."
!isEmbed + !user → SSO message + DEV_MODE dropdown (nếu dev)
```

### Sidebar Logout
```
isEmbed → ẩn logout button hoàn toàn
!isEmbed → hiện logout button, gọi logout() từ context
```

## Related Code Files

- Modify: `packages/web/src/features/auth/components/login-page.tsx`
- Modify: `packages/web/src/features/layout/components/app-sidebar.tsx`
- Depends on: `packages/web/src/shared/lib/token-store.ts` (Phase 1)
- Depends on: `packages/web/src/features/auth/contexts/auth-context.tsx` (Phase 4)

## Implementation Steps

1. **login-page.tsx**:
   - Import `setTokens` from `token-store.ts`
   - Import `useAuth` to get `isEmbed` and `logout`
   - Dev login handler: thay `localStorage.setItem("jwt", data.token)` bằng:
     ```ts
     setTokens(data.token, Date.now() + 8 * 3600 * 1000, "");
     ```
   - Xóa branch `isEmbed` hiển thị "Đang chờ xác thực" + postMessage listener
   - Thay bằng: embed mode (không có token) → hiện "Không tìm thấy phiên làm việc hợp lệ. Vui lòng truy cập từ ứng dụng chính."
   - Xóa `localStorage.setItem("jwt", ...)` hoàn toàn

2. **app-sidebar.tsx**:
   - Import `useAuth` để lấy `isEmbed` và `logout`
   - Thay `localStorage.removeItem("jwt")` + `window.location.href = "/login"` bằng `logout()` từ context
   - Wrap logout button trong điều kiện: `{!isEmbed && <button onClick={logout}>...</button>}`
   - Trong embed mode: ẩn cả logout section, không chỉ disable

## Success Criteria

- [ ] Dev login store token qua `setTokens()` với 3 keys
- [ ] `localStorage.setItem("jwt", ...)` không còn trong login-page.tsx
- [ ] PostMessage waiting UI đã được xóa
- [ ] Embed mode hiện message phù hợp thay vì "Đang chờ xác thực"
- [ ] Sidebar ẩn logout button khi `isEmbed`
- [ ] Sidebar logout gọi `logout()` từ context, không gọi `localStorage.removeItem` trực tiếp