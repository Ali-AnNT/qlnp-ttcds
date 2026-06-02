---
name: research-playwright-e2e-testing-260528
description: Research report on Playwright E2E testing for React + Vite app
metadata:
  type: report
  created: 2026-05-28
  project: qlnp-ttcds
---

# Research Report: Playwright E2E Testing for QLNP-TTCDS

**Status:** DONE
**Date:** 2026-05-28

---

## Executive Summary

QLNP-TTCDS is a React 18 + Vite + TypeScript SPA with .NET FastEndpoints backend. Currently uses Vitest for unit testing. **Playwright is the recommended E2E testing solution** for cross-browser testing of critical user flows.

**Key Pages to Test:**
- `/login` - Dev login, SSO redirect
- `/` (Dashboard) - Role-based access
- `/leave/new`, `/leave/my` - Leave request creation/management
- `/approval` - Manager approval workflow
- `/calendar` - Calendar view
- `/summary`, `/reports` - GD.PGD analytics
- `/violations` - Violation tracking
- `/config` - System configuration (QTHT only)

---

## Project Context

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Vite 5 + TypeScript 5 |
| State | Zustand 5, TanStack Query 5 |
| Routing | React Router DOM 6 |
| Backend | .NET 10 + FastEndpoints |
| Auth | JWT + postMessage (iframe embed support) |
| Testing (existing) | Vitest for unit tests |
| Dev Mode | Mock users via `/auth/dev/login` |

---

## Research Findings

### 1. Playwright Setup for React + Vite

**Installation:**
```bash
cd packages/web
npm init playwright@latest
# Or: npm install -D @playwright/test playwright
```

**Recommended Configuration (`playwright.config.ts`):**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5100',
    trace: 'on-first-retry',
    // Run against real API with dev mode
    extraHTTPHeaders: {
      'X-Dev-Mode': 'true',
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5100',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      VITE_DEV_MODE: 'true',
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Add for full cross-browser: firefox, webkit
  ],
});
```
```

**Separate `tsconfig` for tests:**
```json
// e2e/tsconfig.json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["./**/*.ts"]
}
```

### 2. Page Object Model (POM) Structure

```
packages/web/
├── e2e/
│   ├── pages/
│   │   ├── login.page.ts
│   │   ├── dashboard.page.ts
│   │   ├── leave-new.page.ts
│   │   ├── leave-my.page.ts
│   │   ├── approval.page.ts
│   │   └── ...
│   ├── components/          # Reusable UI components
│   │   ├── header.component.ts
│   │   └── sidebar.component.ts
│   ├── fixtures/
│   │   ├── auth.fixture.ts  # Login helpers
│   │   └── api.fixture.ts   # Mock API responses
│   ├── data/
│   │   └── test-users.ts    # Dev test accounts
│   └── tests/
│       ├── login.spec.ts
│       ├── leave-request.spec.ts
│       └── ...
```

**Example Page Object:**
```typescript
// e2e/pages/login.page.ts
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly userSelect: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userSelect = page.locator('select').first();
    this.loginButton = page.getByRole('button', { name: /đăng nhập/i });
    this.errorMessage = page.locator('[class*="text-destructive"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async devLogin(username: string) {
    await this.userSelect.selectOption(username);
    await this.loginButton.click();
    await this.page.waitForURL('/');
  }
}
```

### 3. Auth Fixture for Dev Mode

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

type AuthFixtures = {
  loggedInAs: (role: 'QTHT' | 'GD.PGD' | 'LD.PCM' | 'CB.PCM') => Promise<void>;
  loginPage: LoginPage;
};

const DEV_USERS = {
  'QTHT': 'quantri',
  'GD.PGD': 'trinh.vo',
  'LD.PCM': 'nvhau.ttcds',
  'CB.PCM': 'htquy.ttcds',
} as const;

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
  
  loggedInAs: async ({ page }, use) => {
    await use(async (role) => {
      await page.goto('/login');
      await page.locator('select').selectOption(DEV_USERS[role]);
      await page.getByRole('button', { name: /đăng nhập/i }).click();
      await page.waitForURL('/');
    });
  },
});

export { expect } from '@playwright/test';
```

### 4. Test Examples

**Login Test:**
```typescript
// e2e/tests/login.spec.ts
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Login', () => {
  test('dev login works for CB.PCM role', async ({ loginPage }) => {
    await loginPage.devLogin('htquy.ttcds');
    await expect(page).toHaveURL('/');
  });

  test('shows error on invalid selection', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page.locator('[class*="text-destructive"]')).toBeVisible();
  });
});
```

**Leave Request Flow:**
```typescript
// e2e/tests/leave-request.spec.ts
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Leave Request', () => {
  test('CB.PCM can create new leave request', async ({ loggedInAs }) => {
    await loggedInAs('CB.PCM');
    
    await page.goto('/leave/new');
    // Fill form, submit, verify
  });

  test('LD.PCM can approve leave request', async ({ loggedInAs }) => {
    await loggedInAs('LD.PCM');
    
    await page.goto('/approval');
    // Approve pending request
  });
});
```

### 5. CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main, dev ]

jobs:
  playwright:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      
      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version: lts/*
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build web app
        run: pnpm --filter @qlnp/web build
        
      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps
        
      - name: Run E2E tests
        run: pnpm --filter @qlnp/web exec playwright test
        
      - uses: actions/upload-artifact@v5
        if: always()
        with:
          name: playwright-report
          path: packages/web/playwright-report/
          retention-days: 30
```

### 6. Running Tests

```bash
# Development
cd packages/web
npx playwright test              # Run all tests
npx playwright test --headed     # Watch mode
npx playwright test --ui         # UI mode

# CI
npx playwright test --project=chromium  # Single browser
npx playwright show-report       # View HTML report
```

---

## Recommendations

### Setup Order
1. Install `@playwright/test` in `packages/web`
2. Create `e2e/` directory structure
3. Add `playwright.config.ts` with Vite dev server integration
4. Create base fixtures (auth, page objects)
5. Write smoke tests for critical flows
6. Add GitHub Actions workflow

### Test Priorities
| Priority | Tests | Rationale |
|----------|-------|-----------|
| P0 | Login, Dashboard | Gate for all other tests |
| P1 | Leave request CRUD | Core business flow |
| P1 | Approval workflow | Manager interaction |
| P2 | Calendar, Reports | Read-only views |
| P3 | Config | Admin only, low volume |

### Key Practices
- Use `data-testid` attributes for stable selectors (request frontend team)
- Fallback to semantic locators (`getByRole`, `getByText`)
- Avoid brittle CSS selectors
- Use `page.waitForURL()` after navigation
- Parallel tests with `fullyParallel: true`

---

## Confirmed Answers

| Question | Answer |
|----------|--------|
| E2E tests target | Real API (via `VITE_DEV_MODE=true`) |
| CI env | `VITE_DEV_MODE=true` confirmed |
| DB cleanup | Not needed |
| Visual regression | TBD |

---

## Unresolved Questions

~~1. Should E2E tests run against real API or mock server?~~ → **Real API**
~~2. Need to confirm if `VITE_DEV_MODE=true` is set in CI?~~ → **Yes, confirmed**
~~3. Database state management between tests (cleanup strategy)?~~ → **Not needed**
4. Visual regression testing needed? → **TBD - evaluate later**

**Remaining open question:** Visual regression (screenshot diff) - will decide after initial smoke tests.