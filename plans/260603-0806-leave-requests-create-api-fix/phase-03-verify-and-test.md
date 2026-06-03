---
phase: 3
title: "Verify and test"
status: completed
priority: P1
effort: "30m"
dependencies: [1, 2]
---

# Phase 3: Verify and test

## Overview

Compile and smoke-test both backend and frontend changes. Confirm the validator lambda fix and error message parsing work end-to-end.

## Requirements

- Functional: API compiles, frontend compiles, validation errors shown as readable Vietnamese text in toast
- Non-functional: No regressions in existing leave request flows

## Implementation Steps

1. **Compile backend**: Run `dotnet build` in `packages/api/` — verify no errors
2. **Compile frontend**: Run `pnpm build` or `tsc --noEmit` in `packages/web/` — verify no TypeScript errors
3. **Manual smoke test** (if API accessible):
   - Submit a leave request with a past date → should see Vietnamese error message in toast, not raw JSON
   - Submit a valid leave request → should succeed normally
4. **Delegate to tester agent**: Run existing test suite to check for regressions

## Success Criteria

- [x] Backend compiles without errors
- [x] Frontend compiles without TypeScript errors
- [x] Validation errors display as readable Vietnamese messages (not raw JSON)
- [x] Existing leave request creation flow still works
- [x] Update leave request flow still works (same validator fix applies)

## Risk Assessment

- Low risk: both changes are small, targeted, and backward-compatible
- Lambda change is purely runtime behavior — no API contract change
- Error parsing change only affects display, not data flow