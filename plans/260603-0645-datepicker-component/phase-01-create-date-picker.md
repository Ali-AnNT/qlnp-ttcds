---
phase: 1
title: "Create DatePicker Component"
status: completed
priority: P1
effort: 1.5h
---

## Context Links

- Research report: `plans/reports/research-260603-0643-datepicker-manual-input-report.md`
- Calendar component: `packages/web/src/shared/ui/calendar.tsx`
- Popover component: `packages/web/src/shared/ui/popover.tsx`
- Input component: `packages/web/src/shared/ui/input.tsx`
- Button component: `packages/web/src/shared/ui/button.tsx`
- Consumer: `packages/web/src/features/leave-requests/components/leave-new-page.tsx:7`
- date-fns locale usage: `packages/web/src/features/calendar/components/calendar-grid.tsx:2`
- Code standards: `docs/code-standards.md`

## Overview

Create `DatePicker` component at `packages/web/src/shared/ui/date-picker.tsx` with calendar popup + manual text input, 2-way sync, Vietnamese locale, blur validation.

<!-- Updated: Validation Session 1 - iterate on existing file, blur resets to last valid date -->

## Key Insights

1. **Dual state pattern** (from research): `inputValue` (string, raw text) separate from `date` (Date|undefined, parsed). Only sync when parse succeeds. This avoids input flicker.
2. **react-day-picker v8 `disabled` prop** accepts `{ before: Date, after: Date }` object for date range disabling.
3. **Calendar component** (`calendar.tsx:10`) accepts all `DayPicker` props via spread — can pass `locale`, `disabled`, `mode="single"`, `selected`, `onSelect` directly.
4. **Consumer API** already defined in `leave-new-page.tsx:216-224`: `date`, `onSelect`, `placeholder`, `fromDate`.
5. **Vietnamese locale** (`vi`) imported from `date-fns/locale` — already used in `calendar-grid.tsx:3`.
6. **No calendar icon** currently in project — need to use `CalendarIcon` from `lucide-react`.
7. **date-fns v4 API verified**: `parse(dateStr, format, referenceDate)` + `isValid(date)` signatures match plan expectations. Runtime tested: `parse("03/06/2026", "dd/MM/yyyy", new Date())` → valid Date, `parse("bad", ...)` → Invalid Date, `isValid` correctly returns false. (Verified: Validation Session 1)

## Requirements

### Functional

- FR1: Click calendar icon button → open Calendar popover
- FR2: Select date on Calendar → input shows `dd/MM/yyyy`, popover auto-closes
- FR3: Type valid date (dd/MM/yyyy) in input → Calendar highlights selected date, `onSelect` fires
- FR4: Type invalid/partial date → input keeps text, Calendar unchanged, `onSelect` NOT called
- FR5: Blur input with invalid text → reset to formatted `date` prop value (confirmed: reset to last valid date, not clear)
- FR6: `fromDate`/`toDate` props disable dates in Calendar
- FR7: Calendar displays Vietnamese month/day names
- FR8: `disabled` prop disables both input and icon button
- FR9: `showTime` prop exists on API surface (no logic, reserved for future)

### Non-Functional

- NFR1: File under 200 lines (split if needed)
- NFR2: Zero new npm dependencies
- NFR3: Compile without errors
- NFR4: Follow shadcn/ui component patterns (named export, forwardRef where needed)
- NFR5: Accessible: `role="combobox"`, `aria-expanded`, `aria-haspopup="dialog"` on input

## Architecture

### Component Structure

```
DatePicker (controlled component)
├── Internal state: inputValue (string), open (boolean)
├── Derived from props: date (Date | undefined)
├── Popover (Radix)
│   ├── PopoverTrigger → div (relative container)
│   │   ├── Input (manual text entry, dd/MM/yyyy)
│   │   └── Button (icon only, CalendarIcon, toggles popover)
│   └── PopoverContent → Calendar (react-day-picker v8, Vietnamese locale)
```

### Data Flow

```
User types in Input
  → handleInputChange: setInputValue(text)
  → parse(text, "dd/MM/yyyy", new Date())
  → isValid(parsed)?
    YES → call onSelect(parsed) → parent updates date prop → Calendar reflects
    NO  → keep inputValue, do nothing

User selects on Calendar
  → handleCalendarSelect(date)
  → setInputValue(format(date, "dd/MM/yyyy"))
  → call onSelect(date)
  → setOpen(false)

User blurs Input with invalid text
  → handleBlur: parse(inputValue) invalid?
    YES + date prop exists → setInputValue(format(date, "dd/MM/yyyy"))
    YES + no date prop     → setInputValue(""), call onSelect(undefined)
    NO  → already valid, no action

Parent changes date prop
  → useEffect: sync inputValue from date prop (format to dd/MM/yyyy)
```

### Props Interface

```tsx
interface DatePickerProps {
  date?: Date;                           // Controlled selected date
  onSelect?: (date: Date | undefined) => void;  // Selection callback
  placeholder?: string;                  // Input placeholder text
  fromDate?: Date;                       // Disable dates before this
  toDate?: Date;                         // Disable dates after this
  disabled?: boolean;                   // Disable entire component
  formatStr?: string;                    // Display format (default "dd/MM/yyyy")
  locale?: Locale;                       // date-fns locale (default vi)
  showTime?: boolean;                    // API surface for future time picker
  className?: string;                    // Additional CSS classes for container
}
```

## Related Code Files

### Files to Create

| File | Purpose |
|------|---------|
| `packages/web/src/shared/ui/date-picker.tsx` | Main DatePicker component (already exists — iterate on existing implementation) |

### Files to Modify

None. `leave-new-page.tsx` already imports and uses `DatePicker` from correct path.

### Files to Read (context only)

| File | Why |
|------|-----|
| `packages/web/src/shared/ui/calendar.tsx` | Calendar props, class names |
| `packages/web/src/shared/ui/popover.tsx` | Popover API |
| `packages/web/src/shared/ui/input.tsx` | Input styling |
| `packages/web/src/shared/ui/button.tsx` | Button + buttonVariants |
| `packages/web/src/shared/lib/utils.ts` | `cn()` utility |

## Implementation Steps

1. **Create `date-picker.tsx`** with imports:
   ```tsx
   import * as React from "react";
   import { format, isValid, parse } from "date-fns";
   import { vi } from "date-fns/locale";
   import { CalendarIcon } from "lucide-react";
   import { Calendar } from "@/shared/ui/calendar";
   import { Button } from "@/shared/ui/button";
   import { Input } from "@/shared/ui/input";
   import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
   import { cn } from "@/shared/lib/utils";
   ```

2. **Define `DatePickerProps` interface** as specified in Architecture section. Include `showTime?: boolean` for future API extension.

3. **Implement `DatePicker` component** with:
   - `inputValue` state (`string`), `open` state (`boolean`)
   - `DISPLAY_FORMAT` constant = `"dd/MM/yyyy"` (overridable via `formatStr` prop)
   - `useEffect` to sync `inputValue` from `date` prop when `date` changes externally

4. **Implement `handleInputChange`**:
   - Update `inputValue` with raw text
   - Parse using `parse(val, displayFormat, new Date())`
   - If `isValid(parsed)` AND (no fromDate/toDate constraints OR parsed within range) → call `onSelect(parsed)`
   - If invalid → keep text, do NOT call onSelect

5. **Implement `handleCalendarSelect`**:
   - If date is undefined → `setInputValue("")`, call `onSelect(undefined)`
   - Else → `setInputValue(format(date, displayFormat))`, call `onSelect(date)`, `setOpen(false)`

6. **Implement `handleBlur`**:
   - Parse `inputValue` using display format
   - If invalid AND `date` prop exists → reset `inputValue` to `format(date, displayFormat)`
   - If invalid AND no `date` prop → clear: `setInputValue("")`, call `onSelect(undefined)`
   - If valid → no action (already synced via handleInputChange)

7. **Render structure**:
   ```tsx
   <Popover open={open} onOpenChange={setOpen}>
     <PopoverTrigger asChild>
       <div className={cn("relative flex items-center", className)}>
         <Input
           value={inputValue}
           onChange={handleInputChange}
           onBlur={handleBlur}
           placeholder={placeholder}
           disabled={disabled}
           className="pr-10"
           role="combobox"
           aria-expanded={open}
           aria-haspopup="dialog"
         />
         <Button
           type="button"
           variant="ghost"
           size="icon"
           className="absolute right-0 h-full px-3 hover:bg-transparent"
           disabled={disabled}
           tabIndex={-1}
         >
           <CalendarIcon className="h-4 w-4 opacity-50" />
         </Button>
       </div>
     </PopoverTrigger>
     <PopoverContent className="w-auto p-0" align="start">
       <Calendar
         mode="single"
         selected={date}
         onSelect={handleCalendarSelect}
         locale={locale}
         disabled={disabledDateProp}
         initialFocus
       />
     </PopoverContent>
   </Popover>
   ```

8. **Build `disabledDateProp`** for Calendar from `fromDate`/`toDate`:
   ```tsx
   const disabledDateProp = React.useMemo(() => {
     const parts: { before?: Date; after?: Date } = {};
     if (fromDate) parts.before = fromDate;
     if (toDate) parts.after = toDate;
     return Object.keys(parts).length > 0 ? parts : undefined;
   }, [fromDate, toDate]);
   ```

9. **Export**: named export `DatePicker`, set `displayName`.

## Todo List

- [ ] Create `packages/web/src/shared/ui/date-picker.tsx`
- [ ] Implement DatePickerProps interface with showTime prop
- [ ] Implement dual state (inputValue + open)
- [ ] Implement handleInputChange with date-fns parse + isValid
- [ ] Implement handleCalendarSelect with auto-close
- [ ] Implement handleBlur with reset-to-valid logic
- [ ] Implement render structure (Popover + Input + Button + Calendar)
- [ ] Build disabledDateProp from fromDate/toDate
- [ ] Add Vietnamese locale default
- [ ] Add accessibility attributes (role, aria-expanded, aria-haspopup)
- [ ] Named export with displayName

## Success Criteria

- [ ] File exists at `packages/web/src/shared/ui/date-picker.tsx`
- [ ] File under 200 lines
- [ ] `DatePickerProps` includes `showTime?: boolean` (unused but in API)
- [ ] Calendar opens on icon button click
- [ ] Calendar selection updates input text and closes popover
- [ ] Typing valid dd/MM/yyyy updates Calendar selection
- [ ] Typing invalid text keeps input text, does not call onSelect
- [ ] Blur with invalid text resets to last valid date value
- [ ] fromDate/toDate disables dates in Calendar
- [ ] Vietnamese locale renders month/day names
- [ ] disabled prop disables input and button
- [ ] Zero compile errors

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Input flicker on controlled state sync | `inputValue` is internal state; `useEffect` syncs from `date` prop only when prop changes (not on every render) |
| PopoverTrigger `asChild` with div | Radix `asChild` on a `div` works — it merges event handlers. Input is focusable, button is tabIndex=-1 |
| `parse()` returns invalid Date for partial input | `isValid()` check catches this — partial text like "03/06" won't pass |
| Calendar `disabled` prop shape for v8 | v8 accepts `{ before, after }` object. Verified against react-day-picker v8 API |
| Date-fns `parse` with reference date | `parse(val, fmt, new Date())` — reference date fills missing components (year), but `isValid` catches incomplete parses |

## Security Considerations

- No security concerns — pure UI component, no data persistence

## Next Steps

- Phase 02: Compile verification