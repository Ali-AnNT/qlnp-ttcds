---
phase: 2
title: "Implementation"
status: pending
priority: P1
effort: "2h"
dependencies: ["1"]
---

# Phase 2: Implementation

## Overview
Refactor `LeaveNewPage` component to integrate React Hook Form and Zod validation, replacing manual state tracking and global toast errors.

## Requirements
- Functional:
  - Form validations:
    - `leaveTypeId`: required (must be selected)
    - `startDate`: required, must be >= today
    - `endDate`: required, must be >= `startDate`
    - `reason`: required, not empty/whitespace
    - Overlap: interval `[startDate, endDate]` must not overlap with any approved dates.
  - Form errors:
    - Displayed below respective inputs in red small text (`text-destructive text-xs` or `text-red-500 text-xs`).
  - Days calculation:
    - Should be calculated reactively based on watched form inputs for `startDate` and `endDate`.
- Non-functional:
  - Scope is strictly limited to `packages/web/src/features/leave-requests/components/leave-new-page.tsx`.

## Architecture
- Define form structure interfaces:
  ```typescript
  interface LeaveRequestForm {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }
  ```
- Use `Controller` for wrapping `<Select>` to sync value.
- Use `register` for `startDate`, `endDate`, and `reason` inputs.
- Show dynamic day calculation reactive to `watch(["startDate", "endDate"])`.

## Related Code Files
- Modify: `packages/web/src/features/leave-requests/components/leave-new-page.tsx`

## Implementation Steps
1. Add imports for:
   - `useForm`, `Controller` from `react-hook-form`
   - `zodResolver` from `@hookform/resolvers/zod`
   - `z` from `zod`
2. Define the dynamic schema `createLeaveRequestSchema(approvedDates: Set<string>, today: string)` at the top of the file or just inside the component module scope.
3. Replace the `useState` variables (`leaveTypeId`, `startDate`, `endDate`, `reason`) with the `useForm` hook:
   ```typescript
   const { register, handleSubmit, control, watch, formState: { errors } } = useForm<LeaveRequestForm>({
     resolver: zodResolver(createLeaveRequestSchema(approvedDates, today)),
     defaultValues: {
       leaveTypeId: "",
       startDate: "",
       endDate: "",
       reason: "",
     }
   });
   ```
4. Update `days` calculation logic to watch the fields:
   ```typescript
   const startDateValue = watch("startDate");
   const endDateValue = watch("endDate");
   const days = startDateValue && endDateValue && startDateValue <= endDateValue
     ? Math.max(
         1,
         differenceInBusinessDays(parseISO(endDateValue), parseISO(startDateValue)) + 1
       )
     : 0;
   ```
5. Wrap the Select component inside a `<Controller>`:
   ```tsx
   <Controller
     name="leaveTypeId"
     control={control}
     render={({ field }) => (
       <Select value={field.value} onValueChange={field.onChange}>
         <SelectTrigger>
           <SelectValue placeholder="Chọn loại phép" />
         </SelectTrigger>
         <SelectContent>
           {leaveTypes.map((t) => (
             <SelectItem key={t.id} value={String(t.id)}>
               {t.name}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
     )}
   />
   {errors.leaveTypeId && (
     <p className="text-destructive text-xs mt-1">{errors.leaveTypeId.message}</p>
   )}
   ```
6. Update `startDate` and `endDate` inputs with `register` and show validation messages:
   ```tsx
   <Input
     type="date"
     min={today}
     {...register("startDate")}
   />
   {errors.startDate && (
     <p className="text-destructive text-xs mt-1">{errors.startDate.message}</p>
   )}
   ```
7. Update `reason` textarea with `register`:
   ```tsx
   <Textarea
     {...register("reason")}
     placeholder="Nhập lý do xin nghỉ..."
     rows={3}
   />
   {errors.reason && (
     <p className="text-destructive text-xs mt-1">{errors.reason.message}</p>
   )}
   ```
8. Rewrite `handleSubmit` to work with RHF's `handleSubmit`:
   ```typescript
   const onSubmit = async (data: LeaveRequestForm) => {
     try {
       await submitLeaveRequest({
         leaveTypeId: Number(data.leaveTypeId),
         startDate: data.startDate,
         endDate: data.endDate,
         totalDays: days,
         reason: data.reason,
       });
       toast.success("Đã gửi phê duyệt");
     } catch (e) {
       toast.error(e instanceof Error ? e.message : "Gửi đơn thất bại");
     }
   };
   ```
   Hook this up on the form submit or on the Button `onClick={handleSubmit(onSubmit)}`.
9. Clean up all unused local state variables.

## Success Criteria
- [ ] Zod Schema correctly handles and validates all fields.
- [ ] RHF correctly manages form state, errors, and submission.
- [ ] Overlap check error displays at `startDate` or `endDate`.
- [ ] Component successfully compiles without TypeScript errors.

## Risk Assessment
- *Risk*: Type conversion of `leaveTypeId` from string in UI form to number in API payload.
- *Mitigation*: Convert `data.leaveTypeId` explicitly to `Number` inside the submit handler.
