---
title: "DatePicker Component with Calendar + Manual Text Input"
description: "Create DatePicker component supporting 2 input modes: calendar popup + manual text entry, with Vietnamese locale"
status: pending
priority: P1
effort: 2h
branch: dev
tags: [ui, component, date-picker, react]
created: 2026-06-03
---

## Overview

Create `DatePicker` component at `packages/web/src/shared/ui/date-picker.tsx` supporting:
1. Calendar popup selection (via Popover + Calendar)
2. Manual text input (dd/MM/yyyy format)
3. 2-way sync between input text and calendar
4. Blur validation (invalid text resets to last valid date)
5. Auto-close popover on calendar select
6. `fromDate`/`toDate` disabled date ranges
7. Vietnamese locale for Calendar
8. `showTime` prop (API surface only, no implementation)

## Phases

| Phase | File | Status | Description |
|-------|------|--------|-------------|
| 01 | [phase-01-create-date-picker.md](./phase-01-create-date-picker.md) | completed | Create DatePicker component |
| 02 | [phase-02-compile-verify.md](./phase-02-compile-verify.md) | completed | Compile verification + integration check |

## Key Decisions

- **Dual state**: `inputValue` (string) + `date` (Date|undefined) to avoid input flicker
- **Calendar select** → format to display string, update inputValue, call onSelect, close popover
- **Input change** → parse with date-fns `parse()`, if valid → update date + call onSelect; if invalid → keep text as-is
- **Input blur** → if invalid text, reset to formatted `date` prop value (confirmed: reset to last valid date, not clear)
- **No new deps** — uses existing: date-fns, react-day-picker, Radix Popover, shadcn Input/Button

## Dependencies

- Existing: `Calendar` (`shared/ui/calendar.tsx`), `Popover` (`shared/ui/popover.tsx`), `Input` (`shared/ui/input.tsx`), `Button` (`shared/ui/button.tsx`)
- date-fns: `format`, `parse`, `isValid` (new imports), `vi` locale
- react-day-picker v8 (already installed)

## Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-------------|
| Input flicker on controlled state | Medium | High | Separate `inputValue` state, only sync `date` on valid parse |
| react-day-picker v8 `disabled` prop API | Low | Medium | Pass `disabled={{ before: fromDate, after: toDate }}` per v8 docs |
| Popover focus trap conflicts with Input | Low | Medium | Use `PopoverTrigger` as wrapper div, not as Input directly |
| Time picker extension breaks API | Low | Low | Define `showTime` prop now, implement later |

## Success Criteria

- Component renders with Input + calendar icon button
- Click icon → opens Calendar popover in Vietnamese
- Select date on Calendar → input shows dd/MM/yyyy, popover closes
- Type valid date in input → Calendar highlights selected date
- Type invalid date → input keeps text, Calendar unchanged
- Blur with invalid text → resets to last valid date value
- `fromDate`/`toDate` disables dates in Calendar
- Compile passes with zero errors

## Validation Log

### Session 1 — 2026-06-03
**Trigger:** User requested `/ck:plan validate`
**Questions asked:** 4

#### Verification Results
- **Tier:** Light (2 phases)
- **Claims checked:** 12
- **Verified:** 12 | **Failed:** 0 | **Unverified:** 0
- Minor: `vi` import at `calendar-grid.tsx:2` not `:3`
- date-fns v4 API verified at runtime: `parse(dateStr, fmt, refDate)` + `isValid(date)` match plan expectations

#### Questions & Answers

1. **[Architecture]** When user types invalid text and blurs input, should it reset to last valid date, clear, or keep text?
   - Options: Reset to last valid date | Clear input entirely | Keep invalid text
   - **Answer:** Reset to last valid date
   - **Rationale:** Prevents accidental data loss; matches plan spec

2. **[Scope]** `date-picker.tsx` already exists (untracked). Iterate or rewrite?
   - Options: Iterate on existing file | Rewrite from scratch per plan
   - **Answer:** Iterate on existing file
   - **Rationale:** Avoids discarding work already done; align existing code with plan spec

3. **[Risk]** Calendar `initialFocus` may not exist in react-day-picker v8. Approach?
   - Options: Try initialFocus, fallback to autoFocus | Skip auto-focus | Use autoFocus instead
   - **Answer:** Try initialFocus, fallback to autoFocus
   - **Rationale:** Phase 02 compile check catches mismatch; minimal risk

4. **[Assumptions]** date-fns v4 `parse()`/`isValid()` not yet used in codebase. Verify API first?
   - Options: Verify v4 API first | Implement per plan, fix in Phase 02
   - **Answer:** Verify v4 API first
   - **Rationale:** Runtime test confirmed v4 API matches plan expectations. No breaking changes found.

#### Confirmed Decisions
- Blur behavior: reset to last valid date (not clear)
- Existing file: iterate, not rewrite
- Calendar focus: try initialFocus first, fallback to autoFocus
- date-fns v4: API verified, compatible with plan

#### Action Items
- [x] Update plan.md blur language: "current date or clears" → "last valid date"
- [x] Verify date-fns v4 parse/isValid at runtime — PASSED
- [x] Update phase-01 blur behavior to match confirmed decision
- [x] Add note to phase-01 about iterating on existing file

#### Impact on Phases
- Phase 01: Update blur behavior (reset to last valid date only), add note about iterating existing file

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-create-date-picker.md, phase-02-compile-verify.md
- Decision deltas checked: 4
- Reconciled stale references: 1 (calendar-grid.tsx line ref `:3` → `:2`)
- Unresolved contradictions: 0