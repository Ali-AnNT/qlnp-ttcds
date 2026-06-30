---
title: "Migrate React Router to v7 Data Router + Fix Navigation Paths"
description: "Upgrade react-router-dom@6.30.1 → react-router@7 with createBrowserRouter data router pattern, extract route paths into typed constants, fix 404 link bugs in dashboard, and replace window.location.href hard reloads with router navigate()"
status: pending
priority: P1
branch: "feat/update-deploy-cjs-ttcds-preset"
tags: [react-router, navigation, bug-fix, migration]
blockedBy: []
blocks: []
created: "2026-06-03T02:51:18.829Z"
createdBy: "ck:plan"
source: skill
---

# Migrate React Router to v7 Data Router + Fix Navigation Paths

## Overview

Migrate from `react-router-dom@6.30.1` (BrowserRouter + Routes/Route) to `react-router@7` (createBrowserRouter + RouterProvider). Extract hardcoded paths into typed `ROUTES` constants. Fix 3 dashboard links pointing to non-existent routes. Replace `window.location.href` hard reloads with `navigate()` for dev login, keep full reload for logout (defensive clear).

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Research](./phase-01-research.md) | ✅ Done | — |
| 2 | [Implement Routes Constants](./phase-02-implement-routes-constants.md) | Pending | 30min |
| 3 | [Migrate Router to Data Router](./phase-03-migrate-router-to-data-router.md) | Pending | 1h |
| 4 | [Fix All Navigation References](./phase-04-fix-all-navigation-references.md) | Pending | 45min |
| 5 | [Test & Verify](./phase-05-test-verify.md) | Pending | 30min |

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth guard pattern | Loader-based `hasAccessToken()` check | Simple, synchronous, no React context needed in loaders. `AuthProvider` wraps `RouterProvider` for component-level `useAuth()`. |
| Logout navigation | Keep `window.location.href` for logout | Defensive: full reload clears all client state (React Query cache, Zustand, etc.). Safer for auth flows. |
| Dev login navigation | `navigate("/", { replace: true })` | SPA-friendly, no unnecessary reload. |
| Route constants | `as const` object in `app/routes.ts` | Single source of truth, type-safe, easy to import. No auto-gen needed for app size. |
| Data router mode | `createBrowserRouter` (not framework mode) | Direct migration path, no Vite plugin needed, minimal config change. |

## Dependencies

- None (standalone frontend change, no backend impact)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| `useAuth()` hook called outside AuthProvider context | Runtime error | AuthProvider wraps RouterProvider; loader only checks `hasAccessToken()` from localStorage |
| Sidebar `menuItems` paths don't match ROUTES constants | 404 clicks | Phase 2 creates constants, Phase 4 updates sidebar + header to use them |
| ESLint boundary rule blocks `app/routes.ts` imports from features | Build error | `app/` allows all imports per ESLint boundaries config; features import from `@/app/routes` (allowed) |
| `react-router@7` peer dependency conflicts with React 18 | Install fails | React Router v7 supports React >=18; no conflict expected |
| **NavLink `end` prop breaks** (red team C1) | "Tổng quan" highlighted on every child route | Fix `end` prop logic in sidebar — use `end` for leaf NavLinks only |
| **Absolute vs relative paths in createBrowserRouter** (red team R3) | Routes double-up paths like `/path//path/child` | Route definitions use relative paths; ROUTES constants for navigation only |
| **AuthProvider stale token** (red team R1) | User sees broken page when token expires mid-session | AuthProvider calls `clearTokens()` + `window.location.href = ROUTES.login` on auth failure |
| **Dev login navigate() race** (red team R2) | Navigate fires before AuthProvider sees new token | Use `retryAuth()` after `setTokens()`, let useEffect handle navigation |