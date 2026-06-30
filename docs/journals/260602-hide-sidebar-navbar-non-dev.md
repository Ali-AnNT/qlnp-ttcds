# Hide Sidebar and Navbar When DevMode Is False

**Date**: 2026-06-02 10:24
**Severity**: Low
**Component**: Layout (`packages/web/src/features/layout/components/app-layout.tsx`)
**Status**: Resolved

## What Happened

The application needed to operate as an embedded widget inside a parent SSO portal in production. When `VITE_DEV_MODE !== "true"`, the AppSidebar and AppHeader must disappear entirely -- the hosting application already provides its own navigation. Only the routed page content (`<Outlet />`) should render.

## The Brutal Truth

This was a clean, small-scope change that went exactly as planned. No drama, no surprises. The real question was whether we would over-engineer it -- and we didn't. Temptation existed to add a toggle button, a configurable padding system, or query-parameter-based navigation. All rejected. The hosting app already has navigation. YAGNI held.

## Technical Details

- Single file modified: `app-layout.tsx`
- `const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true"` checked at module scope (not per-render -- Vite inlines env vars at build time, so this is a static boolean after bundling)
- Non-dev path: renders `<div><main><Outlet /></main></div>` with standard `p-4 md:p-6` padding
- Dev path: unchanged, full sidebar + header + mobile overlay layout

## What We Tried

Straightforward. No failed attempts.

## Root Cause Analysis

Not a bug fix -- a feature for production embed mode. The root need: the app is deployed inside an iframe/container where the parent SSO portal controls navigation. Showing our own sidebar/header in that context would create duplicate nav chrome and confuse users.

## Lessons Learned

- **Module-scope env checks are fine for Vite.** `import.meta.env.VITE_DEV_MODE === "true"` gets baked at build time. No runtime cost, no flicker, no hydration mismatch.
- **Keep padding in non-dev mode.** Decided to keep `p-4 md:p-6` even without sidebar so content doesn't touch screen edges. The parent container is not responsible for our internal spacing.
- **Navigation is the host's job.** No toggle, no hidden button, no query-param routing. The parent SSO portal already has nav configuration. Adding our own would be redundant and break the embed contract.

## Next Steps

None. Feature complete. If future requirements demand conditional padding or a reveal-toggle in embed mode, revisit then -- not now.