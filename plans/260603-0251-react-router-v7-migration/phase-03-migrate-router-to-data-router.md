---
phase: 3
title: "Migrate Router to Data Router"
status: pending
priority: P1
effort: "1h"
dependencies: [2]
---

# Phase 3: Migrate Router to Data Router

## Overview

Rewrite `router.tsx` using `createBrowserRouter`, update `main.tsx` to use `RouterProvider`, replace `BrowserRouter`, and create an auth loader for protected routes.

## Requirements

- Functional: All routes work identically to current setup; auth guard redirects unauthenticated users before render
- Non-functional: No flash of content on redirect; auth check is synchronous (localStorage token check)

## Architecture

### Before (v6 BrowserRouter)
```
main.tsx → App → Providers → BrowserRouter → Routes → AuthGuard → AppLayout → Outlet → child routes
```

### After (v7 Data Router)
```
main.tsx → Providers → RouterProvider → [authLoader → AppLayout → Outlet → child routes]
```

Key changes:
- `BrowserRouter` + `Routes`/`Route` → `createBrowserRouter` route objects
- `<AuthGuard>` wrapper → `loader: authLoader` on protected route group + `AuthProvider` handles invalid tokens
- `<Navigate to="..." replace />` route redirects → `loader: () => { throw redirect("...") }`
- `App.tsx` simplified: `Providers` wraps `RouterProvider`
- `NotFound.tsx` used as `ErrorBoundary` for root route

### ⚠️ Critical: Relative vs Absolute Paths

`createBrowserRouter` child routes use **relative paths** (no leading `/`). The `ROUTES` constants are **absolute** (e.g., `/quan-ly-nghi-phep/tong-quan`). Route **definitions** must use relative paths; `ROUTES` constants are for **navigation** only (`Link to`, `NavLink to`, `navigate()`, `redirect()`).

```ts
// ❌ WRONG — absolute path in child route definition
{ path: ROUTES.dashboard, Component: DashboardPage }
// Creates: /quan-ly-nghi-phep//quan-ly-nghi-phep/tong-quan (doubled!)

// ✅ CORRECT — relative path in child route definition
{ path: "tong-quan", Component: DashboardPage }
// Resolves to: /quan-ly-nghi-phep/tong-quan (correct)
```

### ⚠️ Auth Safety Net (Red Team Finding)

When `authLoader` passes (token exists in localStorage) but `AuthProvider` discovers the token is invalid (401 from API), the user sees a broken state with `user: null`. Without `AuthGuard` in the component tree, nothing redirects them.

**Fix:** In `auth-context.tsx`, when `fetchUser` fails and no valid token exists, call `clearTokens()` + `window.location.href = ROUTES.login`:

```ts
// In AuthProvider's fetchUser failure path:
} else {
  clearTokens();
  window.location.href = ROUTES.login;
}
```

This replaces the current behavior of just setting `user: null` and relying on `AuthGuard` to redirect.

### Auth Loader
```ts
// app/auth-loader.ts
import { redirect } from "react-router";
import { hasAccessToken } from "@/shared/lib/token-store";
import { ROUTES } from "./routes";

export function authLoader() {
  if (!hasAccessToken()) {
    throw redirect(ROUTES.login);
  }
  return null;
}
```

`hasAccessToken()` reads from `localStorage` (synchronous) — works in loaders outside React context. Full auth verification still happens inside `AuthProvider` when components mount.

## Related Code Files

- Modify: `packages/web/src/app/router.tsx` — complete rewrite
- Modify: `packages/web/src/app/App.tsx` — remove `AppRouter`, add `RouterProvider`
- Modify: `packages/web/src/main.tsx` — update imports if needed
- Create: `packages/web/src/app/auth-loader.ts` — auth check for data router
- Keep: `packages/web/src/features/auth/hooks/use-auth-guard.tsx` — keep as component-level fallback, but primary guard moves to loader
- Keep: `packages/web/src/features/auth/contexts/auth-context.tsx` — `AuthProvider` still wraps `RouterProvider`

## Implementation Steps

1. **Install `react-router@7`**:
   ```bash
   cd packages/web
   pnpm remove react-router-dom
   pnpm add react-router@^7
   ```
   React Router v7 supports React >=18 — no React version change needed.

2. **Create `packages/web/src/app/auth-loader.ts`**:
   - Import `redirect` from `"react-router"`
   - Import `hasAccessToken` from `"@/shared/lib/token-store"`
   - Import `ROUTES` from `"./routes"`
   - Export `authLoader()` — synchronous check, `throw redirect(ROUTES.login)` if no token

3. **Rewrite `packages/web/src/app/router.tsx`**:
   - Replace `BrowserRouter` + `Routes`/`Route` JSX with `createBrowserRouter` route objects
   - Root redirect `/` → `loader: () => { throw redirect(ROUTES.layout) }`
   - Protected route group: add `loader: authLoader` to `/quan-ly-nghi-phep` route
   - Index redirect: `index: true, loader: () => { throw redirect(ROUTES.dashboard) }`
   - Child routes use `ROUTES.*` paths (relative paths within parent)
   - 404: `path: "*", Component: NotFound` at root level
   - Export `router` constant (not component)
   - Remove `BrowserRouter`, `Routes`, `Route`, `Navigate` imports from `react-router-dom`
   - Import `createBrowserRouter`, `redirect` from `"react-router"`
   - Import `RouterProvider` type not needed here (used in App.tsx)

4. **Update `packages/web/src/app/App.tsx`**:
   - Remove `AppRouter` component import and usage
   - Import `RouterProvider` from `"react-router/dom"`
   - Import `router` from `"./router"`
   - Render: `<Providers><RouterProvider router={router} /></Providers>`
   - `ErrorBoundary` stays wrapping `Providers`

5. **Update `packages/web/src/main.tsx`** (if needed):
   - Verify `createRoot` + render still works — should need no changes since App.tsx handles router

6. **Delete `use-auth-guard.tsx`** (red team: dead code without route tree):
   - Remove the file entirely — `authLoader` handles primary auth guard, `AuthProvider` handles invalid-token redirect
   - Keeping unused code confuses future developers
   - If we want a component-level guard later, we can recreate it

7. **Update `NotFound.tsx`** import:
   - `import { useLocation } from "react-router"` (was `react-router-dom`)
   - Change `<a href="/">` → `<Link to={ROUTES.layout}>` with `import { Link } from "react-router"`

8. **Verify `AuthProvider` placement**:
   - `AuthProvider` must wrap `RouterProvider` so `useAuth()` works in route components
   - Current `providers.tsx` should already include `AuthProvider` — verify and keep

9. **Run `pnpm build`** to verify TypeScript compilation:
   ```bash
   cd packages/web && pnpm build
   ```

## Success Criteria

- [ ] `react-router-dom` removed from `package.json`
- [ ] `react-router@^7` added to `package.json`
- [ ] `pnpm build` passes with zero errors
- [ ] `router.tsx` uses `createBrowserRouter` with route objects
- [ ] `App.tsx` renders `RouterProvider` with `router` prop
- [ ] `authLoader` redirects to `/login` when no token
- [ ] All routes render correctly (verified in Phase 5)
- [ ] No `react-router-dom` imports remain in any source file