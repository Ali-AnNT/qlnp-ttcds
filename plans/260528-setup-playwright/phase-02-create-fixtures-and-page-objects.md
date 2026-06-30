---
phase: 2
title: "Create Fixtures and Page Objects"
status: pending
priority: P1
effort: "1h"
dependencies: [1]
---

# Phase 2: Create Fixtures and Page Objects

## Overview

Create auth fixtures, page objects for login, dashboard, and base test structure.

## Context Links

- Phase 1: [phase-01-setup-infrastructure.md](./phase-01-setup-infrastructure.md)
- Research: [research-playwright-e2e-testing-260528.md](../reports/research-playwright-e2e-testing-260528.md)

## Requirements

- Functional: Auth fixture with dev login, Page Objects for Login + Dashboard
- Non-functional: TypeScript strict mode, POM pattern

## Architecture

```
e2e/
├── fixtures/
│   └── auth.fixture.ts      # Auth helpers + test.extend
├── pages/
│   ├── login.page.ts        # LoginPage class
│   └── dashboard.page.ts    # DashboardPage class
├── data/
│   └── test-users.ts        # Dev user accounts
└── tests/
    └── smoke.spec.ts        # Placeholder
```

## Related Code Files

- Create: `e2e/fixtures/auth.fixture.ts`
- Create: `e2e/pages/login.page.ts`
- Create: `e2e/pages/dashboard.page.ts`
- Create: `e2e/data/test-users.ts`

## Implementation Steps

1. **Create `e2e/data/test-users.ts`**
   ```typescript
   export const DEV_USERS = {
     QTHT: 'quantri',
     'GD.PGD': 'trinh.vo',
     'LD.PCM': 'nvhau.ttcds',
     'CB.PCM': 'htquy.ttcds',
   } as const;

   export type UserRole = keyof typeof DEV_USERS;
   ```

2. **Create `e2e/pages/login.page.ts`**
   ```typescript
   import { type Page, type Locator } from '@playwright/test';

   export class LoginPage {
     readonly page: Page;
     readonly userSelect: Locator;
     readonly loginButton: Locator;

     constructor(page: Page) {
       this.page = page;
       this.userSelect = page.locator('select').first();
       this.loginButton = page.getByRole('button', { name: /đăng nhập/i });
     }

     async goto() {
       await this.page.goto('/login');
     }

     async devLogin(username: string) {
       await this.userSelect.selectOption(username);
       await this.loginButton.click();
       await this.page.waitForURL('**/');
     }
   }
   ```

3. **Create `e2e/pages/dashboard.page.ts`**
   ```typescript
   import { type Page, type Locator } from '@playwright/test';

   export class DashboardPage {
     readonly page: Page;
     readonly welcomeText: Locator;
     readonly sidebar: Locator;

     constructor(page: Page) {
       this.page = page;
       this.welcomeText = page.getByText(/hệ thống/i);
       this.sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
     }

     async goto() {
       await this.page.goto('/');
     }
   }
   ```

4. **Create `e2e/fixtures/auth.fixture.ts`**
   ```typescript
   import { test as base, type Page } from '@playwright/test';
   import { LoginPage } from '../pages/login.page';
   import { DashboardPage } from '../pages/dashboard.page';
   import { DEV_USERS, type UserRole } from '../data/test-users';

   type Fixtures = {
     loginPage: LoginPage;
     dashboardPage: DashboardPage;
     loggedInAs: (role: UserRole) => Promise<void>;
   };

   export const test = base.extend<Fixtures>({
     loginPage: async ({ page }, use) => {
       const loginPage = new LoginPage(page);
       await use(loginPage);
     },

     dashboardPage: async ({ page }, use) => {
       const dashboardPage = new DashboardPage(page);
       await use(dashboardPage);
     },

     loggedInAs: async ({ page }, use) => {
       await use(async (role) => {
         await page.goto('/login');
         await page.locator('select').selectOption(DEV_USERS[role]);
         await page.getByRole('button', { name: /đăng nhập/i }).click();
         await page.waitForURL('**/');
       });
     },
   });

   export { expect } from '@playwright/test';
   ```

## Success Criteria

- [ ] `DEV_USERS` constant exported with 4 dev accounts
- [ ] `LoginPage` class with `goto()` and `devLogin()` methods
- [ ] `DashboardPage` class created
- [ ] `auth.fixture.ts` exports `test` and `expect`
- [ ] `loggedInAs(role)` fixture logs in and redirects to `/`

## Risk Assessment

- **Low**: POM pattern, follows research findings