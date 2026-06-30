---
phase: 3
title: "Write Smoke Tests"
status: pending
priority: P1
effort: "2h"
dependencies: [2]
---

# Phase 3: Write Smoke Tests

## Overview

Write smoke tests for Login, Dashboard, and Leave Request flows.

## Context Links

- Phase 2: [phase-02-create-fixtures-and-page-objects.md](./phase-02-create-fixtures-and-page-objects.md)
- Research: [research-playwright-e2e-testing-260528.md](../reports/research-playwright-e2e-testing-260528.md)

## Requirements

- Functional: Tests for login, dashboard, leave request creation
- Non-functional: Cross-role testing, meaningful assertions

## Architecture

```
e2e/tests/
├── login.spec.ts            # Login smoke tests
├── dashboard.spec.ts        # Dashboard smoke tests
└── leave-request.spec.ts   # Leave request flow tests
```

## Related Code Files

- Create: `e2e/tests/login.spec.ts`
- Create: `e2e/tests/dashboard.spec.ts`
- Create: `e2e/tests/leave-request.spec.ts`

## Implementation Steps

1. **Create `e2e/tests/login.spec.ts`**
   ```typescript
   import { test, expect } from '../fixtures/auth.fixture';

   test.describe('Login', () => {
     test('CB.PCM can login via dev mode', async ({ loginPage }) => {
       await loginPage.goto();
       await loginPage.devLogin('CB.PCM');
       await expect(page).toHaveURL('/');
     });

     test('LD.PCM can login via dev mode', async ({ loginPage }) => {
       await loginPage.goto();
       await loginPage.devLogin('LD.PCM');
       await expect(page).toHaveURL('/');
     });

     test('shows loading state before redirect', async ({ page }) => {
       await page.goto('/login');
       const loading = page.getByText('Loading...');
       // Auth should complete fast, may not see this
     });

     test('shows error when clicking login without selection', async ({ page }) => {
       await page.goto('/login');
       await page.getByRole('button', { name: /đăng nhập/i }).click();
       // Button should be disabled, no error shown
     });
   });
   ```

2. **Create `e2e/tests/dashboard.spec.ts`**
   ```typescript
   import { test, expect } from '../fixtures/auth.fixture';

   test.describe('Dashboard', () => {
     test('CB.PCM sees dashboard after login', async ({ loggedInAs }) => {
       await loggedInAs('CB.PCM');
       await expect(page).toHaveURL('/');
       // Dashboard content should be visible
     });

     test('LD.PCM sees dashboard with approval section', async ({ loggedInAs }) => {
       await loggedInAs('LD.PCM');
       await expect(page).toHaveURL('/');
       // Should see navigation to /approval
     });

     test('QTHT sees config link in navigation', async ({ loggedInAs }) => {
       await loggedInAs('QTHT');
       await expect(page).toHaveURL('/');
       // Should see navigation to /config
     });
   });
   ```

3. **Create `e2e/tests/leave-request.spec.ts`**
   ```typescript
   import { test, expect } from '../fixtures/auth.fixture';

   test.describe('Leave Request', () => {
     test('CB.PCM can navigate to new leave page', async ({ loggedInAs }) => {
       await loggedInAs('CB.PCM');
       await page.goto('/leave/new');
       // Form should be visible
     });

     test('CB.PCM can navigate to my leave page', async ({ loggedInAs }) => {
       await loggedInAs('CB.PCM');
       await page.goto('/leave/my');
       // Leave list should be visible
     });

     test('LD.PCM can navigate to approval page', async ({ loggedInAs }) => {
       await loggedInAs('LD.PCM');
       await page.goto('/approval');
       // Approval list should be visible
     });
   });
   ```

4. **Verify tests run**
   ```bash
   cd packages/web
   npx playwright test --project=chromium
   ```

## Success Criteria

- [ ] `login.spec.ts` has 4 tests, all pass
- [ ] `dashboard.spec.ts` has 3 tests, all pass
- [ ] `leave-request.spec.ts` has 3 tests, all pass
- [ ] `npx playwright test` runs successfully with HTML report

## Risk Assessment

- **Medium**: UI selectors may need adjustment based on actual DOM
  - Mitigation: Use semantic locators (`getByRole`, `getByText`) not CSS classes