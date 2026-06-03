# Leave New Page Validation Refactor

**Date**: 2026-06-03 02:10
**Severity**: Medium
**Component**: `packages/web/src/features/leave-requests/components/leave-new-page.tsx`
**Status**: Resolved

## What Happened

Replaced manual `useState`-based form validation and global `toast.error` messaging with `react-hook-form` + `zodResolver`. Errors now display directly underneath their corresponding form fields instead of firing a generic toast notification.

## The Brutal Truth

The original validation was a mess of scattered `useState` variables and imperative checks that spat a single toast.error at the top of the screen. Users had no idea which field was wrong -- just "something failed, figure it out." This is the kind of UX that makes people hate forms. The refactor itself was straightforward but the dynamic overlap check (validating against async-loaded `approvedDates`) required careful schema design since Zod schemas are normally static.

## Technical Details

- Replaced 4 separate `useState` calls (`leaveTypeId`, `startDate`, `endDate`, `reason`) with single `useForm<LeaveRequestForm>` hook
- Dynamic Zod schema via `createLeaveRequestSchema(approvedDates: Set<string>, today: string)` -- recreated each render when `approvedDates` or `today` changes, so the resolver always has fresh overlap data
- Cross-field validation (date ordering, past-date check, overlap check) handled in `.superRefine()` with `z.ZodIssueCode.custom` issues targeted at specific field paths (`["startDate"]`, `["endDate"]`)
- Shadcn `<Select>` wrapped in `<Controller>` because `register` cannot bind to non-native inputs
- Day calculation now reactive via `watch("startDate")` / `watch("endDate")` instead of derived from local state
- Error styling: `text-destructive text-xs` below each field

## What We Tried

- Considered static Zod schema with `z.refine` on individual fields -- rejected because overlap check requires cross-field access to both `startDate` and `endDate`, plus external `approvedDates` state
- Considered keeping `useState` alongside RHF for the Select -- rejected; `Controller` handles it cleanly

## Root Cause Analysis

The original implementation grew organically: someone added fields one at a time, each with its own `useState` and a manual `if (!value) toast.error(...)` check. No cohesive validation strategy existed. The result was fragile, hard to extend, and hostile to users who had to guess which field triggered the toast.

## Lessons Learned

- Dynamic schemas in Zod are fine when you pass the external state as arguments and let the resolver recreate -- no need for `z.asyncRefine` or `useEffect` workarounds
- Always use `<Controller>` for Shadcn `<Select>`; `register` only works on native HTML inputs
- `.superRefine()` is the right tool for cross-field validation that needs to target errors at specific paths -- plain `.refine()` on the whole object pollutes `formState.errors.root` instead of field-level errors
- When a form has more than 2 fields with validation, skip the manual useState approach entirely -- it does not scale

## Next Steps

- Monitor for any edge cases where `approvedDates` set is stale (e.g., rapid successive submissions before query refetch)
- Consider extracting `createLeaveRequestSchema` into a shared module if other components need the same validation rules
- Apply the same RHF + Zod pattern to other form pages that still use manual validation