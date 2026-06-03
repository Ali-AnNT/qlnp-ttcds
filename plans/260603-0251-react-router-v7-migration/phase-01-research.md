---
phase: 1
title: "Research"
status: completed
priority: P2
effort: "30min"
dependencies: []
---

# Phase 1: Research

## Overview

Research completed. React Router v7 API, sidebar config audit, and test coverage analysis done.

## Key Findings

### React Router v7 Migration
- Package: `react-router-dom` → `react-router` (unified). Install `react-router@7.16.0`.
- `createBrowserRouter` + `RouterProvider` from `react-router/dom` replaces `BrowserRouter`.
- All hooks/components (`useNavigate`, `useLocation`, `Link`, `NavLink`, `Navigate`, `Outlet`) same API, import from `react-router`.
- `redirect()` utility replaces `<Navigate>` in route definitions — use `throw redirect("/path")` in loaders.
- Auth guard: loader-based `hasAccessToken()` check + `throw redirect("/login")`.
- `AuthProvider` wraps `RouterProvider` so `useAuth()` works in components.

### Codebase Audit
- **9 files** import from `react-router-dom`.
- Sidebar paths hardcoded in `app-sidebar.tsx` (menuItems array) + duplicated in `app-header.tsx` (breadcrumbMap).
- Dashboard has 3 broken links: `/leave/new`, `/approval`, `/calendar` → should be Vietnamese paths under `/quan-ly-nghi-phep/`.
- Zero test files reference router — no test migration needed.
- ESLint boundaries enforce VSA: features importable only via `index.ts`.

### Auth Context
- `auth-context.tsx` uses `window.location.href = "/login"` for logout (keep — defensive full reload).
- `login-page.tsx` uses `window.location.href = "/"` for dev login (change to `navigate()`).
- `use-auth-guard.tsx` uses `<Navigate to="/login" replace />` (keep component, but add loader for data router).

## Success Criteria

- [x] React Router v7 API documented
- [x] Sidebar config audit complete
- [x] Test coverage audit complete
- [x] Auth flow analysis complete