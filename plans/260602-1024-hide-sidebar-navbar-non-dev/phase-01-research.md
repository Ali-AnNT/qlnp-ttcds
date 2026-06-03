---
phase: 1
title: Research
status: completed
priority: P2
effort: 30m
dependencies: []
---

# Phase 1: Research

## Overview
Confirm target files, check existing environment variable logic, and verify design layout files.

## Requirements
- Functional: Identify the file where `AppSidebar` and `AppHeader` are rendered (`packages/web/src/features/layout/components/app-layout.tsx`).
- Non-functional: Determine how to correctly check environment variables using Vite configuration.

## Related Code Files
- Modify: `packages/web/src/features/layout/components/app-layout.tsx`

## Implementation Steps
1. Locate `app-layout.tsx` and confirm the styling structure.
2. Confirm that Vite handles environment variables via `import.meta.env.VITE_DEV_MODE`.
3. Confirm LoginPage checks `import.meta.env.VITE_DEV_MODE === "true"`.

## Success Criteria
- [x] Confirmed target file is `packages/web/src/features/layout/components/app-layout.tsx`.
- [x] Confirmed env checking logic matches `login-page.tsx`.
