---
phase: 5
title: "Test & Verify"
status: pending
priority: P1
effort: "30min"
dependencies: [4]
---

# Phase 5: Test & Verify

## Overview

Run build, lint, and manual verification to confirm the migration is complete and all navigation works correctly.

## Requirements

- Functional: All routes render, all links navigate to correct pages, auth redirect works
- Non-functional: Zero build errors, zero lint errors, zero console errors

## Implementation Steps

### 5.1 Automated Checks

1. **Install dependencies**:
   ```bash
   cd packages/web && pnpm install
   ```
   Verify `react-router@7.x` is in `pnpm-lock.yaml` and `react-router-dom` is removed.

2. **TypeScript compilation**:
   ```bash
   cd packages/web && pnpm build
   ```
   Must pass with zero errors.

3. **ESLint**:
   ```bash
   cd packages/web && pnpm lint
   ```
   Must pass — especially the `boundaries/entry-point` and `no-restricted-imports` rules.

4. **Existing tests**:
   ```bash
   cd packages/web && pnpm test
   ```
   All 5 existing test files should pass (they don't touch router).

5. **Grep verification** — zero occurrences of:
   ```bash
   # No react-router-dom imports
   rg 'from "react-router-dom"' packages/web/src/
   # No hardcoded route strings (except in routes.ts and auth-loader.ts)
   rg '"/quan-ly-nghi-phep' packages/web/src/ --glob '!**/routes.ts' --glob '!**/auth-loader.ts'
   rg '"/leave' packages/web/src/
   rg '"/approval"' packages/web/src/
   rg '"/calendar"' packages/web/src/
   rg '"/login"' packages/web/src/ --glob '!**/routes.ts' --glob '!**/auth-loader.ts'
   # Deleted file should not exist
   test ! -f packages/web/src/features/auth/hooks/use-auth-guard.tsx
   ```

### 5.2 Manual Verification (Dev Server)

Start dev server and verify these flows:

| Flow | Expected Behavior |
|------|-------------------|
| Visit `/` | Redirects to `/quan-ly-nghi-phep/tong-quan` |
| Visit `/quan-ly-nghi-phep` (no token) | Redirects to `/login` |
| Dev login → select user → click "Đăng nhập" | Navigates to dashboard (no full page reload) |
| Click "Tạo đơn nghỉ phép" in dashboard | Navigates to `/quan-ly-nghi-phep/xin-nghi-phep/tao-đon-xin-nghi-phep` |
| Click "Phê duyệt đơn" in dashboard | Navigates to `/quan-ly-nghi-phep/phe-duyet-đon` |
| Click "Xem lịch nghỉ phép" in dashboard | Navigates to `/quan-ly-nghi-phep/theo-doi-lich-nghi-phep` |
| Click sidebar "Tổng quan" | Active state highlights, shows dashboard |
| Click sidebar child "Tạo đơn mới" | Navigates to leave-new page |
| Click "Hủy" button on leave-new page | Goes back (browser history) |
| Logout | Full reload to `/login` (intentional) |
| Visit `/nonexistent-path` | Shows 404 page with link to home |
| Breadcrumb shows correct label for each route | Header displays Vietnamese breadcrumb text |

### 5.3 Bundle Size Check

```bash
cd packages/web && pnpm build
```

Compare output bundle size with previous build. React Router v7 should be similar or smaller than v6.

## Success Criteria

- [ ] `pnpm install` completes — `react-router-dom` removed, `react-router@7` installed
- [ ] `pnpm build` passes with zero TypeScript errors
- [ ] `pnpm lint` passes with zero ESLint errors
- [ ] `pnpm test` — all 5 existing tests pass
- [ ] Grep verification: zero `react-router-dom` imports, zero hardcoded paths outside `routes.ts`
- [ ] Manual: all 12 flows in table above work correctly
- [ ] Bundle size not significantly larger than before migration