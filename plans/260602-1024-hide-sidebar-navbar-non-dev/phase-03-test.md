---
phase: 3
title: Test
status: completed
priority: P2
effort: 30m
dependencies:
  - '2'
---

# Phase 3: Test

## Overview
Perform manual tests to verify the layout behavior in both dev and production mode configurations.

## Requirements
- Verify sidebar/navbar visibility changes matching the `VITE_DEV_MODE` variable.

## Implementation Steps
1. Set `VITE_DEV_MODE=true` and run local dev server (`pnpm dev` or `bun run dev`). Verify layout behaves normally with sidebar/navbar present.
2. Toggle `VITE_DEV_MODE=false` and verify sidebar/navbar disappear, and content is scaled properly to full screen.

## Success Criteria
- [x] Sidebar and navbar are shown when `VITE_DEV_MODE=true`.
- [x] Sidebar and navbar are hidden when `VITE_DEV_MODE=false`.
