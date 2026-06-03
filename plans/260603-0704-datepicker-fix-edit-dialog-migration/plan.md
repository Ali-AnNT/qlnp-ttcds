---
title: "Fix DatePicker Calendar Navigation + Migrate Edit Dialog"
description: "Fix DatePicker not navigating to selected date's month + migrate edit dialog from native Input to DatePicker + react-hook-form + Zod"
status: completed
priority: P1
branch: "dev"
tags: [ui, bug, date-picker, react-hook-form, zod]
blockedBy: []
blocks: []
created: "2026-06-03T07:04:44.333Z"
createdBy: "ck:plan"
source: skill
---

# Fix DatePicker Calendar Navigation + Migrate Edit Dialog

## Overview

Two related issues in leave-request feature:

1. **Bug**: DatePicker component opens Calendar to current month instead of selected date's month. Root cause: missing `defaultMonth` prop on Calendar.
2. **UX gap**: Edit dialog (`leave-my-page.tsx`) uses native `<Input type="date">` while create page uses custom `DatePicker` + `react-hook-form` + `Zod`. Migrate edit dialog for consistency.

## Phases

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | [Fix DatePicker defaultMonth](./phase-01-fix-datepicker-defaultmonth.md) | Pending | Add `defaultMonth` to Calendar so popover opens to selected date's month |
| 2 | [Migrate Edit Dialog to react-hook-form + Zod](./phase-02-migrate-edit-dialog-to-react-hook-form-zod.md) | Pending | Replace native Input with DatePicker + useForm + Zod in edit dialog |

## Key Decisions

- **`defaultMonth` over `month`**: Uncontrolled — lets user navigate freely, resets to date's month on popover open (Radix unmounts content when closed → Calendar remounts)
- **Keep `useState` for `editRequest`**: Controls dialog open/close, not form fields
- **Auto-clear endDate preserved**: When startDate changes to date after endDate, clear endDate via `setValue("endDate", "", { shouldValidate: false })`
- **Inline errors over banner**: Match create page pattern — remove overlap warning banner, show errors under fields
- **Edit schema same structure as create schema**: Both use `superRefine` for cross-field validation

## Dependencies

- **Precedes**: plan `260603-0645-datepicker-component` (DatePicker component creation — completed, this is a follow-up)
- No blocking dependencies