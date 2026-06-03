---
phase: 2
title: Implement
status: completed
priority: P2
effort: 30m
dependencies:
  - '1'
---

# Phase 2: Implement

## Overview
Implement conditional layout rendering based on `VITE_DEV_MODE`.

## Requirements
- Functional: Bypass rendering of `AppSidebar` and `AppHeader` when `VITE_DEV_MODE !== "true"`.
- Styling: Ensure main container fits full screen cleanly.

## Related Code Files
- Modify: `packages/web/src/features/layout/components/app-layout.tsx`

## Implementation Steps
1. Add `const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";` in `app-layout.tsx`.
2. Check `!DEV_MODE` inside `AppLayout`.
3. If `!DEV_MODE`, render only the surrounding wrapper and the main `<Outlet />` without sidebar, overlay, or header.

## Success Criteria
- [x] Code compiles without TypeScript errors.
- [x] When `VITE_DEV_MODE === "false"`, sidebar and navbar are not rendered.
