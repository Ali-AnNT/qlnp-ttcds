---
phase: 1
title: "Research & Analysis"
status: pending
priority: P2
effort: "1h"
dependencies: []
---

# Phase 1: Research & Analysis

## Overview
Confirm available library dependencies, design pattern compatibility, and component integration methods for React Hook Form + Zod resolver in `@qlnp/web`.

## Requirements
- Functional:
  - Form validation rules logic defined in `docs/reports/leave-new-page-validation-brainstorm.md` must be respected.
  - Shadcn select and native inputs must integrate correctly with `react-hook-form`.
- Non-functional:
  - The schema should run dynamically to react to changes in `approvedDates`.

## Architecture
- Zod schema generator function: `createLeaveRequestSchema(approvedDates: Set<string>, today: string)`.
- Use React Hook Form's `useForm` hook with `zodResolver`.
- Custom Shadcn `Select` component will be wrapped in `react-hook-form`'s `<Controller>` component to bind selection state cleanly without external React `useState` hooks.

## Related Code Files
- Modify: `packages/web/src/features/leave-requests/components/leave-new-page.tsx`

## Implementation Steps
1. Verify package installation: Check if `react-hook-form`, `zod`, and `@hookform/resolvers` can be imported in `packages/web`.
2. Inspect the current UI component usage:
   - Identify inputs (Start Date, End Date, Reason).
   - Identify Select element (Leave Type Id).
3. Draft integration patterns for Shadcn `<Select>` component using `react-hook-form` `<Controller>`.
4. Validate imports and ensure `date-fns` functions (`parseISO`, `differenceInBusinessDays`, `eachDayOfInterval`, `format`) are imported correctly.

## Success Criteria
- [ ] Confirmed package dependencies are available in `packages/web/package.json`.
- [ ] Binding strategy for custom `<Select>` component using `<Controller>` is drafted and approved.

## Risk Assessment
- *Risk*: Dynamic validation schema updates (e.g., when `approvedDates` async query resolves).
- *Mitigation*: The validation resolver receives the latest `approvedDates` by recreating the resolver when the schema arguments change.
