---
phase: 1
title: "Fix DatePicker defaultMonth"
status: completed
priority: P1
effort: "15m"
dependencies: []
---

# Phase 1: Fix DatePicker defaultMonth

## Overview

Calendar popover in DatePicker always opens to current month. When `date` prop has a value in a different month, user must manually navigate to find it. Fix: add `defaultMonth` prop.

## Requirements

- Functional: When DatePicker has a `date` value, Calendar popover must open showing the month containing that date
- Non-functional: No change to existing behavior when `date` is undefined (show current month)

## Architecture

**Root cause**: `react-day-picker` v8 `DayPicker` defaults to `new Date()` for displayed month when no `month`/`defaultMonth` prop provided. Calendar component (`calendar.tsx`) spreads all extra props via `{...props}` → `defaultMonth` passes through correctly.

**Why `defaultMonth` not `month`**: `month` (controlled) would require `onMonthChange` state management and conflict with user navigation. `defaultMonth` sets initial month on mount, then user navigates freely. Radix Popover unmounts content when closed → Calendar remounts each time → `defaultMonth` picks up latest `date`.

## Related Code Files

- Modify: `packages/web/src/shared/ui/date-picker.tsx` (line 167-174, Calendar element)
- Read: `packages/web/src/shared/ui/calendar.tsx` (confirms `{...props}` spread at line 48)

## Implementation Steps

1. In `date-picker.tsx`, add `defaultMonth={date ?? new Date()}` to `<Calendar>` element (line 167)
2. Verify: no other changes needed — Calendar passes prop through, DayPicker handles it natively

### Before
```tsx
<Calendar
  mode="single"
  selected={date}
  onSelect={handleCalendarSelect}
  locale={activeLocale}
  disabled={disabledDateProp}
  initialFocus
/>
```

### After
```tsx
<Calendar
  mode="single"
  selected={date}
  onSelect={handleCalendarSelect}
  locale={activeLocale}
  disabled={disabledDateProp}
  defaultMonth={date ?? new Date()}
  initialFocus
/>
```

## Success Criteria

- [ ] DatePicker with `date` in future month → Calendar opens to that month
- [ ] DatePicker with `date` in past month → Calendar opens to that month
- [ ] DatePicker with `date={undefined}` → Calendar opens to current month (same as before)
- [ ] No TypeScript errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Radix Popover doesn't unmount content | Low | Medium | Verified: default Radix behavior unmounts; Calendar remounts on each open |
| `defaultMonth` prop name wrong for react-day-picker v8 | Low | High | Confirmed: v8 uses `defaultMonth` (uncontrolled) / `month` (controlled) |