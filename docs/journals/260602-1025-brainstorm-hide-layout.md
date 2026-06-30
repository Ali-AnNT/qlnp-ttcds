# Journal: Hiding Layout Elements in Non-Dev Mode

- **Date**: 2026-06-02
- **Topic**: Hide Sidebar & Navbar when `VITE_DEV_MODE !== "true"`.
- **Decision & Implementation**: 
  - Modified `AppLayout` (`packages/web/src/features/layout/components/app-layout.tsx`) to check `import.meta.env.VITE_DEV_MODE === "true"`.
  - In non-dev mode, bypassed rendering of `AppSidebar` and `AppHeader`, returning only the core content wrapper with standard spacing classes.
  - Simplified `collapsed` logic in `AppLayout` by removing a redundant ternary statement.
- **Verification**:
  - Build and type-checking completed successfully: `pnpm build` passed without errors.
  - Lint checks passed successfully (`pnpm lint`).
  - Unit/integration test suite passed (35 tests in 5 files, 100% pass rate).
  - Staff Engineer code review completed successfully with no critical issues.
  - Checked off success criteria in all plan phases.
