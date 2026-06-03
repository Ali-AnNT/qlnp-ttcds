---
phase: 2
title: "Migrate Edit Dialog to react-hook-form + Zod"
status: completed
priority: P1
effort: "1.5h"
dependencies: [1]
---

# Phase 2: Migrate Edit Dialog to react-hook-form + Zod

## Overview

Replace native `<Input type="date">` and manual `useState` in edit dialog with custom `DatePicker` + `react-hook-form` + `zodResolver`. Matches create page pattern for consistency.

## Requirements

- Functional: Edit dialog uses `DatePicker` component for start/end dates (same UX as create page)
- Functional: Form validation via Zod schema with `superRefine` (same rules as create page)
- Functional: Inline error messages under each field (no toast.error for validation)
- Functional: Auto-clear endDate when startDate changes to date after endDate
- Non-functional: `approvedDates` excludes current request being edited (existing behavior preserved)

## Architecture

**Current**: Manual `useState` for 4 edit fields + `<Input type="date">` + manual validation in `handleSaveEdit` with `toast.error`

**Target**: `useForm` + `zodResolver` + `Controller`-wrapped `DatePicker` + `register` for Textarea + inline error display

**Data flow**:
```
openEdit(r)
  → setEditRequest(r)          // controls dialog open
  → reset({ ...r data })       // populate form via react-hook-form

User edits → watch() triggers re-compute of editDays + overlap display
User submits → handleSubmit(onEditSubmit) → Zod validates → mutation
```

**Key difference from create page**: `approvedDates` excludes `editRequest?.id` from overlap check. Schema factory function is structurally identical but receives different `approvedDates` Set.

## Related Code Files

- Modify: `packages/web/src/features/leave-requests/components/leave-my-page.tsx`
- Reference: `packages/web/src/features/leave-requests/components/leave-new-page.tsx` (pattern to follow)
- Read: `packages/web/src/features/leave-requests/hooks/use-leave-requests.ts` (mutation interface)
- Read: `packages/web/src/shared/ui/date-picker.tsx` (fixed in Phase 1)

## Implementation Steps

### Step 1: Update imports

Add:
```ts
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { DatePicker } from "@/shared/ui/date-picker";
```

Remove `Input` import from `@/shared/ui/input` if no longer used anywhere in file.

### Step 2: Add edit schema factory (module-level, before component)

```ts
const editLeaveRequestSchema = (approvedDates: Set<string>, today: string) =>
  z.object({
    leaveTypeId: z.string().min(1, "Vui lòng chọn loại phép"),
    startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
    reason: z.string().min(1, "Vui lòng nhập lý do")
      .refine((val) => val.trim().length > 0, "Lý do nghỉ không được chỉ chứa khoảng trắng"),
  }).superRefine((data, ctx) => {
    if (!data.startDate || !data.endDate) return;
    if (data.startDate > data.endDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ngày bắt đầu phải trước hoặc trùng ngày kết thúc", path: ["endDate"] });
      return;
    }
    if (data.startDate < today) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Không được chọn ngày trong quá khứ", path: ["startDate"] });
      return;
    }
    try {
      const interval = { start: parseISO(data.startDate), end: parseISO(data.endDate) };
      const hasOverlap = eachDayOfInterval(interval).some((d) => approvedDates.has(format(d, "yyyy-MM-dd")));
      if (hasOverlap) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Khoảng ngày nghỉ trùng với đơn đã được duyệt", path: ["startDate"] });
      }
    } catch { /* malformed dates handled by field validators */ }
  });

type EditLeaveRequestForm = z.infer<ReturnType<typeof editLeaveRequestSchema>>;
```

### Step 3: Replace manual useState with useForm

Remove these 4 states:
```ts
// REMOVE:
const [editLeaveTypeId, setEditLeaveTypeId] = useState("");
const [editStartDate, setEditStartDate] = useState("");
const [editEndDate, setEditEndDate] = useState("");
const [editReason, setEditReason] = useState("");
```

Keep `editRequest` state (controls dialog open/close).

Add `useForm`:
```ts
const { register, handleSubmit, control, watch, reset, setValue, getValues, formState: { errors } } = useForm<EditLeaveRequestForm>({
  resolver: zodResolver(editLeaveRequestSchema(approvedDates, today)),
  defaultValues: { leaveTypeId: "", startDate: "", endDate: "", reason: "" },
});
```

### Step 4: Replace editDays + overlap computation

```ts
const startDateValue = watch("startDate");
const endDateValue = watch("endDate");

const editDays = startDateValue && endDateValue && startDateValue <= endDateValue
  ? countBusinessDays(parseISO(startDateValue), parseISO(endDateValue), workDays)
  : 0;
```

Remove `editHasOverlap` useMemo — overlap now in Zod `superRefine`, shown as inline error.

### Step 5: Update openEdit

```ts
const openEdit = (r: LeaveRequestDto) => {
  setEditRequest(r);
  reset({
    leaveTypeId: String(r.leaveTypeId),
    startDate: r.startDate,
    endDate: r.endDate,
    reason: r.reason || "",
  });
};
```

### Step 6: Replace handleSaveEdit with onEditSubmit

```ts
const onEditSubmit = async (data: EditLeaveRequestForm) => {
  if (!editRequest) return;
  try {
    await updateRequest({
      id: editRequest.id,
      data: {
        leaveTypeId: Number(data.leaveTypeId),
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: editDays,
        reason: data.reason,
      },
    });
    toast.success("Đã cập nhật và gửi lại đơn");
    setEditRequest(null);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Cập nhật đơn thất bại");
  }
};
```

All manual validation removed — Zod handles it.

### Step 7: Update Dialog JSX

**A. Wrap form fields in `<form>`:**
```tsx
<form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
  {/* fields */}
</form>
```

**B. Replace Select for leaveTypeId with Controller** (same as create page pattern).

**C. Replace `<Input type="date">` for startDate with Controller-wrapped DatePicker:**
```tsx
<Controller
  name="startDate"
  control={control}
  render={({ field }) => (
    <DatePicker
      date={field.value ? parseISO(field.value) : undefined}
      onSelect={(d) => {
        const val = d ? format(d, "yyyy-MM-dd") : "";
        field.onChange(val);
        // Auto-clear endDate if before new startDate
        const currentEndDate = getValues("endDate");
        if (currentEndDate && val && currentEndDate < val) {
          setValue("endDate", "", { shouldValidate: false });
        }
      }}
      placeholder="Chọn ngày bắt đầu"
      fromDate={parseISO(today)}
    />
  )}
/>
```

**D. Replace `<Input type="date">` for endDate with Controller-wrapped DatePicker:**
```tsx
<Controller
  name="endDate"
  control={control}
  render={({ field }) => (
    <DatePicker
      date={field.value ? parseISO(field.value) : undefined}
      onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
      placeholder="Chọn ngày kết thúc"
      fromDate={startDateValue ? parseISO(startDateValue) : parseISO(today)}
    />
  )}
/>
```

**E. Replace Textarea with register:**
```tsx
<Textarea {...register("reason")} placeholder="Nhập lý do..." rows={3} />
```

**F. Add inline error messages** under each field:
```tsx
{errors.fieldName && <p className="text-destructive text-xs">{errors.fieldName.message}</p>}
```

**G. Save button:** `type="submit"` instead of `onClick={handleSaveEdit}`

**H. Remove:** overlap warning banner (replaced by inline `errors.startDate`)

### Step 8: Clean up unused imports

- Remove `Input` if no longer used
- Keep `useState` (still used for `filterStatus` and `editRequest`)

## Success Criteria

- [ ] Edit dialog opens with DatePicker pre-filled from existing request data
- [ ] Calendar popover opens to month of selected date (not current month)
- [ ] Changing startDate clears endDate if endDate < new startDate
- [ ] Empty fields show inline validation errors on submit
- [ ] endDate < startDate → inline error under endDate
- [ ] startDate in past → inline error under startDate
- [ ] Overlap with approved dates → inline error under startDate
- [ ] Valid submission → success toast, dialog closes, table refreshes
- [ ] No overlap warning banner (replaced by inline errors)
- [ ] No TypeScript compile errors
- [ ] UX consistent with create page (leave-new-page.tsx)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `setValue("endDate", "")` triggers validation error | Medium | Low | Use `{ shouldValidate: false }` to skip validation on auto-clear |
| Zod resolver not reactive to `approvedDates` change | Low | Medium | `approvedDates` is useMemo'd; resolver re-evaluated on re-render (same pattern as create page) |
| Editing request with past startDate (edge case) | Low | Low | Consistent with current behavior — manual validation also blocks past dates |