# DatePicker defaultMonth Fix + Edit Dialog RHF/Zod Migration

- **Date**: 2026-06-03
- **Topic**: Fix DatePicker calendar navigation bug + migrate edit dialog from native `<Input type="date">` to `DatePicker` + `react-hook-form` + `Zod` (parity with create page).
- **Plan**: [260603-0704-datepicker-fix-edit-dialog-migration](../plans/260603-0704-datepicker-fix-edit-dialog-migration/plan.md) (2 phases, both complete).
- **Preceded by**: plan `260603-0645-datepicker-component` (DatePicker component creation).

## What Was Delivered

- **Fix 1**: DatePicker now opens Calendar to selected date's month via `defaultMonth={date ?? new Date()}` on `<Calendar>`.
- **Fix 2**: Edit dialog (`leave-my-page.tsx`) now uses `useForm` + `zodResolver` with `Controller`-wrapped `DatePicker`, matching create page pattern.

## Key Technical Decisions

- **`defaultMonth` over `month`**: uncontrolled. Lets user navigate freely without `onMonthChange` state. Radix Popover unmounts content when closed → Calendar remounts each open → `defaultMonth` re-evaluates from latest `date` prop. No manual sync needed.
- **Root cause of Fix 1**: `react-day-picker` v8 `DayPicker` defaults displayed month to `new Date()` when no `month`/`defaultMonth` provided. Calendar component spreads `{...props}` so prop passes through cleanly — single-line fix.
- **Kept `useState` for `editRequest`**: dialog open/close control, not form fields. Form state lives entirely in RHF.
- **Auto-clear endDate**: `onSelect` for startDate reads `getValues("endDate")`, clears via `setValue("endDate", "", { shouldValidate: false })` when new start > current end. `shouldValidate: false` prevents stale error flash.
- **Inline errors over banner**: removed overlap warning banner; Zod `superRefine` issues targeted at field paths (`endDate`, `startDate`) render as `text-destructive text-xs` under each field.
- **Edit schema mirrors create schema**: structurally identical, but `approvedDates` excludes the current request being edited (existing behavior preserved — pass filtered set into factory).

## Migration Pattern (edit dialog matching create dialog)

```
openEdit(r)
  → setEditRequest(r)        // controls Dialog open
  → reset({ ...r data })     // populate RHF form

useForm + zodResolver(editSchema(approvedDates, today))
  register()   → Textarea
  Controller   → Select (leaveTypeId) + DatePicker (startDate, endDate)
  watch()      → drives editDays + endDate min-bound

onSubmit → handleSubmit(onEditSubmit) → mutation → close dialog
```

Both `createLeaveRequestSchema` and `editLeaveRequestSchema` are factory functions accepting `(approvedDates, today)` and use `superRefine` with early-return ordering: (1) end ≥ start, (2) start ≥ today, (3) range ∉ approvedDates. Errors attach to the most informative field path.

## Lessons Learned

- When wrapping uncontrolled UI components (DatePicker) in RHF `Controller`, prefer `defaultMonth`/`defaultValue` semantics over controlled `value` — avoids fighting the lib's internal state.
- Radix Popover unmount-on-close is a feature here: it means the form child re-mounts each open, picking up fresh `date` prop without explicit reset.
- Schema factory functions recreate per render when `approvedDates` changes — acceptable at this scale, no `useMemo` needed (same finding as create page journal).
- `shouldValidate: false` on `setValue` is the right escape hatch for auto-clear side effects — without it, users see a confusing "endDate required" error after they just changed startDate.

## Verification

- `pnpm exec tsc --noEmit -p tsconfig.app.json` → clean
- `pnpm exec eslint` on both modified files → clean
- `pnpm test` → no regressions
- Code review: APPROVED (or APPROVED_WITH_CONCERNS pending latest report)

## Next Steps

- Monitor for stale `approvedDates` in edit flow if user opens edit dialog right after a submission (same edge case as create page).
- Consider extracting `createLeaveRequestSchema` + `editLeaveRequestSchema` into a shared `leave-request-schema.ts` if a third call site appears.
- Apply the same RHF + Zod pattern to any remaining forms with manual `useState` validation.
