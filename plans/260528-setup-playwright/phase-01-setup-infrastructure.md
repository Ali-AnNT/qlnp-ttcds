---
phase: 1
title: "Setup Infrastructure"
status: pending
priority: P1
effort: "30m"
dependencies: []
---

# Phase 1: Setup Infrastructure

## Overview

Install Playwright, create `playwright.config.ts`, setup `e2e/` directory structure and `tsconfig.json`.

## Requirements

- Functional: Playwright installed, tests can run with `npx playwright test`
- Non-functional: Chromium only for now, `baseURL: http://localhost:5100`

## Architecture

```
packages/web/
├── e2e/
│   ├── pages/
│   ├── fixtures/
│   ├── data/
│   └── tests/
├── playwright.config.ts
└── tsconfig.e2e.json
```

## Related Code Files

- Create: `packages/web/playwright.config.ts`
- Create: `packages/web/tsconfig.e2e.json`
- Create: `packages/web/e2e/.gitkeep`
- Modify: `packages/web/package.json` (add playwright + scripts)

## Implementation Steps

1. **Install Playwright**
   ```bash
   cd packages/web
   npm install -D @playwright/test
   ```

2. **Create `playwright.config.ts`**
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
     },
     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:5100',
       reuseExistingServer: !process.env.CI,
       timeout: 120 * 1000,
     },
     projects: [
       { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
     ],
   });
   ```

3. **Create `tsconfig.e2e.json`**
   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "strict": true,
       "module": "ESNext",
       "moduleResolution": "bundler"
     },
     "include": ["e2e/**/*.ts"]
   }
   ```

4. **Update `package.json` scripts**
   ```json
   {
     "scripts": {
       "test:e2e": "playwright test",
       "test:e2e:ui": "playwright test --ui",
       "test:e2e:headed": "playwright test --headed",
       "test:e2e:report": "playwright show-report"
     }
   }
   ```

5. **Install Chromium browser**
   ```bash
   npx playwright install chromium
   ```

6. **Create directory structure**
   ```bash
   mkdir -p e2e/{pages,fixtures,data,tests}
   touch e2e/.gitkeep
   ```

## Success Criteria

- [ ] `npx playwright test --version` works
- [ ] `npx playwright install chromium` completes
- [ ] `playwright.config.ts` exists with correct `baseURL`
- [ ] `e2e/` directories created
- [ ] Scripts added to `package.json`

## Risk Assessment

- **Low**: Straightforward install, no existing code modified