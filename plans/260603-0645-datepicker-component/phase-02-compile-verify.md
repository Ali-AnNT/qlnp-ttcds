---
phase: 2
title: "Compile Verification + Integration Check"
status: completed
priority: P1
effort: 0.5h
---

## Context Links

- Phase 01: `plans/260603-0645-datepicker-component/phase-01-create-date-picker.md`
- Consumer: `packages/web/src/features/leave-requests/components/leave-new-page.tsx:7`
- Date utils: `packages/web/src/shared/lib/date-utils.ts`

## Overview

Verify DatePicker component compiles without errors and integrates correctly with existing consumer (`leave-new-page.tsx`). No runtime test — compile check + API contract verification only.

## Key Insights

1. `leave-new-page.tsx:7` already imports `DatePicker` from `@/shared/ui/date-picker` — creating the file should resolve the import.
2. Consumer API contract: `date?: Date`, `onSelect?: (d: Date | undefined) => void`, `placeholder?: string`, `fromDate?: Date` — must match exactly.
3. Compile command: `pnpm --filter web build` or `cd packages/web && npx tsc --noEmit`.

## Requirements

### Functional

- FR1: TypeScript compilation passes with zero errors
- FR2: Vite build passes
- FR3: DatePicker import resolves correctly in leave-new-page.tsx
- FR4: No unused import warnings for `showTime` prop (it's in the type, just unused in consumer)

## Architecture

### Verification Flow

```
1. Run tsc --noEmit in packages/web
   → Check for type errors, missing imports, prop mismatches
2. Run vite build
   → Verify bundling succeeds
3. Grep leave-new-page.tsx for DatePicker usage
   → Confirm prop names match DatePickerProps interface
```

## Related Code Files

### Files to Verify

| File | What to check |
|------|--------------|
| `packages/web/src/shared/ui/date-picker.tsx` | Exists, exports DatePicker, compiles |
| `packages/web/src/features/leave-requests/components/leave-new-page.tsx` | DatePicker import + props match |
| `packages/web/src/shared/lib/date-utils.ts` | No conflicts with date-fns imports |

### Files NOT to Modify

All files — this phase is verification only. If issues found, fix in `date-picker.tsx` only.

## Implementation Steps

1. **Run TypeScript check**:
   ```bash
   cd packages/web && npx tsc --noEmit 2>&1 | head -50
   ```
   - If type errors in `date-picker.tsx`: fix the component
   - If type errors in `leave-new-page.tsx` about DatePicker props: adjust DatePickerProps

2. **Run Vite build**:
   ```bash
   cd packages/web && pnpm build 2>&1 | tail -20
   ```
   - Verify build succeeds, no module resolution errors

3. **Verify API contract** with consumer:
   ```bash
   grep -A5 "DatePicker" packages/web/src/features/leave-requests/components/leave-new-page.tsx
   ```
   - Confirm `date`, `onSelect`, `placeholder`, `fromDate` prop names match
   - Confirm `onSelect` callback signature `(d: Date | undefined) => void` matches

4. **Check file size**:
   ```bash
   wc -l packages/web/src/shared/ui/date-picker.tsx
   ```
   - Must be under 200 lines

5. **If compile fails**: Fix issues in `date-picker.tsx` only. Common fixes:
   - Missing `type` keyword on Locale import
   - react-day-picker v8 `onSelect` type mismatch (expects `Date | undefined`)
   - `Calendar` component not accepting `initialFocus` (may need `autoFocus` in v8)

## Todo List

- [ ] Run `tsc --noEmit` — zero errors
- [ ] Run `pnpm build` — success
- [ ] Verify DatePicker props match leave-new-page.tsx usage
- [ ] Verify file under 200 lines
- [ ] If errors found, fix in date-picker.tsx and re-verify

## Success Criteria

- [ ] `tsc --noEmit` exits with code 0
- [ ] `pnpm build` completes without errors
- [ ] DatePicker props compatible with leave-new-page.tsx consumer
- [ ] `date-picker.tsx` under 200 lines
- [ ] No regressions in other files

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| react-day-picker v8 Calendar prop type mismatch | Check `CalendarProps` type export from `calendar.tsx:8`; pass only documented props |
| `initialFocus` not in v8 Calendar | Remove if type error, Calendar will still work without it |
| Zod resolver type inference break | DatePicker returns `Date | undefined` from onSelect — same as consumer expects |

## Security Considerations

None — compile-time verification only.

## Next Steps

- Implementation can begin after both phases approved