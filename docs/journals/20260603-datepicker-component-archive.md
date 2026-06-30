# DatePicker Component: Calendar + Manual Text Input

**Date**: 2026-06-03
**Severity**: Low
**Component**: packages/web/src/shared/ui/date-picker.tsx
**Status**: Resolved

## What Happened

Created `DatePicker` component at `packages/web/src/shared/ui/date-picker.tsx` supporting 2 input modes (calendar popup + manual `dd/MM/yyyy` text entry) with 2-way sync, Vietnamese locale, and `fromDate`/`toDate` disabled ranges. Validated via `/ck:plan validate` (4 questions, 12/12 claims verified, 0 failures). 2 phases, ~2h effort. No new dependencies.

## Key Technical Decisions

- **Dual state pattern**: `inputValue` (string) + `date` (Date | undefined). Decouples raw text from parsed value — prevents input flicker on every keystroke. `date` only updates when `parse()` returns a valid Date.
- **Blur behavior: reset to last valid date (not clear)**. Confirmed via /ck:plan validate. Invalid text in the input is preserved during typing but reverts to formatted `date` value on blur. Prevents accidental data loss; matches plan spec.
- **Calendar select auto-closes popover** + formats to `dd/MM/yyyy` + calls `onSelect` callback.
- **date-fns v4 API verified at runtime**: `parse(dateStr, fmt, refDate)` + `isValid(date)` match plan expectations. No v3→v4 breaking changes affecting this code.
- **Iterate, don't rewrite**: existing untracked `date-picker.tsx` aligned with plan spec rather than rewritten from scratch.

## Component API Surface

```ts
type DatePickerProps = {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  fromDate?: Date;
  toDate?: Date;
  showTime?: boolean; // API surface only, no implementation
}
```

**Dependencies (all pre-existing)**: `date-fns` (`format`, `parse`, `isValid`, `vi` locale), `react-day-picker` v8, Radix `Popover`, shadcn `Input`/`Button`/`Calendar`.

**react-day-picker v8 disabled prop**: `disabled={{ before: fromDate, after: toDate }}`. `initialFocus` tried first, falls back to `autoFocus` if unavailable.

## What We Tried

1. **Verified date-fns v4 API at runtime** before implementation — caught a potential v3→v4 mismatch before writing code. Confirmed `parse()` and `isValid()` signatures match plan.
2. **Iterated on existing untracked `date-picker.tsx`** rather than rewriting — saved time, avoided discarding prior work, but required careful diff against plan spec.
3. **Build-after-every-step** — kept compile clean throughout phase 01, phase 02 caught zero new errors.

## Root Cause Analysis

N/A — plan executed cleanly. Only minor finding: `vi` import located at `calendar-grid.tsx:2` not `:3` as initially noted in plan. Reconciled in validation log, no code impact.

## Lessons Learned

1. **Verify third-party API at runtime before committing to it in a plan.** date-fns v4 was unverified in this codebase. A 5-minute runtime check prevented potential plan-level rework in phase 02.
2. **Dual state for controlled text inputs is the right pattern** when input value and parsed value diverge (invalid text mid-typing). Single `Date | undefined` state would cause input to clear/format on every keystroke.
3. **`/ck:plan validate` with decision-delta reconciliation catches stale plan references** (line numbers, file paths) that would otherwise survive into the archive. The whole-plan consistency sweep reconciled 1 stale reference (`calendar-grid.tsx:3` → `:2`).
4. **API surface for unimplemented features (`showTime`)** is cheap insurance — costs nothing to define the prop, gives future implementer a stable extension point without breaking call sites.

## Next Steps

- DatePicker ready for integration into leave-request forms, audit filters, any date-range UI
- When `showTime` is needed: extend with `react-day-picker` `mode="single"` + custom time inputs, or swap in a dedicated time-picker library
- Consider extracting `parseDateInput()` helper into `shared/lib/date-utils.ts` if more dual-input components emerge (reusability threshold not yet hit)
