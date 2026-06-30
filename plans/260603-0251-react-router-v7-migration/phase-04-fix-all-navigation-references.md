---
phase: 4
title: "Fix All Navigation References"
status: pending
priority: P1
effort: "45min"
dependencies: [3]
---

# Phase 4: Fix All Navigation References

## Overview

Update all 9 files that import from `react-router-dom` → `react-router`. Replace hardcoded paths with `ROUTES.*` constants. Fix 3 broken dashboard links. Replace `window.location.href` in dev login with `navigate()`.

## Requirements

- Functional: All navigation links point to valid routes; no 404 on click
- Non-functional: Zero `react-router-dom` imports; zero hardcoded route strings

## Architecture

Each file gets two changes:
1. **Import update**: `from "react-router-dom"` → `from "react-router"` (or `from "react-router/dom"` for `RouterProvider`/`createBrowserRouter`)
2. **Path constants**: Replace hardcoded strings with `ROUTES.*`

## Related Code Files

- Modify: `packages/web/src/features/layout/components/app-sidebar.tsx`
- Modify: `packages/web/src/features/layout/components/app-header.tsx`
- Modify: `packages/web/src/features/layout/components/app-layout.tsx`
- Modify: `packages/web/src/features/dashboard/components/dashboard-page.tsx`
- Modify: `packages/web/src/features/auth/components/login-page.tsx`
- Modify: `packages/web/src/features/auth/contexts/auth-context.tsx`
- Delete: `packages/web/src/features/auth/hooks/use-auth-guard.tsx`
- Modify: `packages/web/src/features/auth/index.ts` — remove `AuthGuard` export
- Modify: `packages/web/src/features/leave-requests/components/leave-new-page.tsx`
- Modify: `packages/web/src/app/NotFound.tsx`

## Implementation Steps

### 4.1 `app-sidebar.tsx`

1. Change import: `from "react-router-dom"` → `from "react-router"`
2. Add import: `import { ROUTES } from "@/app/routes"`
3. Replace `menuItems` hardcoded paths:
   - `path: "/"` → `path: ROUTES.dashboard` (sidebar "Tổng quan" links to dashboard)
   - `path: "/leave/new"` → `path: ROUTES.leaveNew`
   - `path: "/leave/my"` → `path: ROUTES.leaveMy`
   - `path: "/approval"` → `path: ROUTES.approval`
   - `path: "/calendar"` → `path: ROUTES.calendar`
   - `path: "/summary"` → `path: ROUTES.summary`
   - `path: "/reports"` → `path: ROUTES.reports`
   - `path: "/violations"` → `path: ROUTES.violations`
   - `path: "/config"` → `path: ROUTES.config`
4. **Fix `NavLink` `end` prop** (red team: CRITICAL):
   - Current: `end={item.path === "/"}` — this breaks because no path will equal `"/"` after migration
   - Change to: `end={item.path === ROUTES.dashboard}` for the dashboard item
   - Or better: set `end` to `true` for all leaf-level NavLinks (items without children)
   - Items WITH children (like "Xin nghỉ phép") should NOT have `end` — they use `isActive` for parent highlighting

### 4.2 `app-header.tsx`

1. Change import: `from "react-router-dom"` → `from "react-router"`
2. Add import: `import { ROUTES } from "@/app/routes"`
3. Replace `breadcrumbMap` hardcoded paths with `ROUTES.*` keys:
   ```ts
   const breadcrumbMap: Record<string, string> = {
     [ROUTES.layout]: "Quản lý nghỉ phép",
     [ROUTES.dashboard]: "Tổng quan",
     [ROUTES.leaveNew]: "Tạo đơn mới",
     [ROUTES.leaveMy]: "Danh sách đơn của tôi",
     [ROUTES.approval]: "Phê duyệt đơn",
     [ROUTES.calendar]: "Theo dõi lịch nghỉ phép",
     [ROUTES.summary]: "Tổng hợp lịch nghỉ",
     [ROUTES.reports]: "Thống kê báo cáo",
     [ROUTES.violations]: "Vượt mức quy định",
     [ROUTES.config]: "Cấu hình quy định",
   };
   ```
   Note: Added `ROUTES.layout` entry ("Quản lý nghỉ phép") — even though this path redirects immediately, it avoids a "Trang" fallback during the brief render.
4. Update `<Link to="/">` → `<Link to={ROUTES.layout}>`

### 4.3 `app-layout.tsx`

1. Change import: `import { Outlet } from "react-router-dom"` → `import { Outlet } from "react-router"`
2. No path changes (just re-export of `Outlet`)

### 4.4 `dashboard-page.tsx` (BUG FIX — 3 broken links)

1. Change import: `import { Link } from "react-router-dom"` → `import { Link } from "react-router"`
2. Add import: `import { ROUTES } from "@/app/routes"`
3. Fix broken links:
   - `<Link to="/leave/new">` → `<Link to={ROUTES.leaveNew}>`
   - `<Link to="/approval">` → `<Link to={ROUTES.approval}>`
   - `<Link to="/calendar">` → `<Link to={ROUTES.calendar}>`

### 4.5 `login-page.tsx`

1. Change import: `import { useNavigate } from "react-router-dom"` → `import { useNavigate } from "react-router"`
2. Add import: `import { ROUTES } from "@/app/routes"`
3. **Dev login flow** (red team: HIGH — `navigate()` after `setTokens()` won't work because `AuthProvider` hasn't seen the new token):
   - Replace `window.location.href = "/"` in `handleDevLogin` with:
     ```ts
     setTokens(data.token, Date.now() + 8 * 3600 * 1000, "");
     await retryAuth(); // triggers AuthProvider to re-fetch user
     // useEffect watching `user` will navigate to dashboard
     ```
   - Remove `window.location.href` entirely from `handleDevLogin`
   - The existing `useEffect([user, navigate])` on line 28 will handle navigation once `retryAuth()` sets `user`
4. **SSO auth redirect** (line 28): Change `navigate("/")` → `navigate(ROUTES.layout, { replace: true })`
5. Remove unused `window.location.href` import if no other usage

### 4.6 `auth-context.tsx`

1. **Keep `window.location.href` for logout** — defensive full reload clears all client state (React Query cache, Zustand, etc.)
2. Change hardcoded `"/login"` string to `ROUTES.login`:
   ```ts
   window.location.href = ROUTES.login;
   ```
3. **Add invalid-token safety net** (red team: HIGH — without AuthGuard in tree, stale tokens leave user on broken page):
   - In `fetchUser` failure path, when no token is valid, add:
   ```ts
   } else {
     clearTokens();
     window.location.href = ROUTES.login;
   }
   ```
   This replaces relying on `AuthGuard` component for redirect. The full reload ensures clean state.
4. Add import: `import { ROUTES } from "@/app/routes"`
5. Note: `auth-context.tsx` is NOT a component — cannot use `useNavigate()`.

### 4.7 Delete `use-auth-guard.tsx`

1. **Delete** `packages/web/src/features/auth/hooks/use-auth-guard.tsx` — no longer used in route tree
2. Remove the `AuthGuard` export from `packages/web/src/features/auth/index.ts` barrel file
3. `authLoader` handles primary guard, `AuthProvider` handles invalid-token redirect

### 4.8 `leave-new-page.tsx`

1. Change import: `import { useNavigate } from "react-router-dom"` → `import { useNavigate } from "react-router"`
2. No path changes (`navigate(-1)` stays as-is — browser history back)

### 4.9 `NotFound.tsx`

1. Change import: `import { useLocation } from "react-router-dom"` → `import { useLocation, Link } from "react-router"`
2. Add import: `import { ROUTES } from "@/app/routes"`
3. Replace `<a href="/">` → `<Link to={ROUTES.layout}>`

## Success Criteria

- [ ] Zero `react-router-dom` imports in `src/` (verified by grep)
- [ ] Zero hardcoded route strings in components (verified by grep)
- [ ] All 3 dashboard links point to correct Vietnamese paths
- [ ] `use-auth-guard.tsx` deleted and removed from barrel export
- [ ] NavLink `end` prop correctly set for leaf vs parent items
- [ ] AuthProvider redirects to `/login` on invalid token (not just sets `user: null`)
- [ ] Dev login uses `retryAuth()` + `useEffect` navigation (no `window.location.href`)
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes