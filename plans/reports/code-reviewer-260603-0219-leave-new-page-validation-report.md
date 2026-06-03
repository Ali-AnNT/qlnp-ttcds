# Code Review: LeaveNewPage Validation Refactor

**File**: `packages/web/src/features/leave-requests/components/leave-new-page.tsx`
**Date**: 2026-06-03
**Reviewer**: code-reviewer
**Verdict**: APPROVED_WITH_CONCERNS (low severity)

---

## Scope
- Single-file refactor (LeaveNewPage only)
- Touchpoints verified: `useLeaveTypes`, `useMyLeaveRequests`, `useSubmitLeaveRequest`, `useAuth` contracts unchanged
- LOC: 274 (refactored from ~135 to 274 — increases because the new Zod schema + per-field error blocks add verbosity)

## Acceptance Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `leaveTypeId` required | PASS | `z.string().min(1, "Vui lòng chọn loại phép")` (line 40); Controller wired (lines 183–203) |
| 2 | `startDate` required, >= today | PASS | `z.string().min(1, …)` (line 41) + `startDate < today` check in `superRefine` (lines 66–73); native `min={today}` (line 214) |
| 3 | `endDate` required, >= startDate | PASS | `z.string().min(1, …)` (line 42) + `startDate > endDate` check (lines 56–63) |
| 4 | `reason` required, not empty/whitespace | PASS | `min(1, …)` + `refine(val => val.trim().length > 0, …)` (lines 43–49) |
| 5 | Range doesn't overlap with approved dates | PASS | `superRefine` block (lines 76–93) iterates `eachDayOfInterval` and checks `approvedDates` set; uses `format(d, "yyyy-MM-dd")` — consistent with how `approvedDates` is built (lines 113–119) |
| 6 | Errors displayed below inputs in `text-destructive text-xs` | PASS | All 4 error blocks use exact class string `text-destructive text-xs` (lines 204–208, 215–219, 228–232, 249–253) |
| 7 | Days calc reactive to watched inputs | PASS | `watch("startDate")` + `watch("endDate")` (lines 144–145); days recomputed on each render (lines 148–157) |
| 8 | Scope strictly limited to one file | PASS | `git diff HEAD --` shows only `leave-new-page.tsx` modified in this commit |
| 9 | TypeScript compiles | PASS | `pnpm --filter @qlnp/web exec tsc --noEmit -p tsconfig.app.json` — only pre-existing `token-refresh.test.ts(110,37)` error (out of scope per prompt) |
| 10 | No new lint errors | PASS | `pnpm exec eslint …` runs clean on the file (only unrelated boundaries warnings) |
| 11 | No breaking changes to public contracts | PASS | `CreateLeaveRequestDto` payload unchanged; `useSubmitLeaveRequest` still receives `{ leaveTypeId: number, startDate, endDate, totalDays, reason }` |

## Touchpoint Verification

| Hook | Result | Evidence |
|------|--------|----------|
| `useAuth` | PASS | Still destructures `user`; `AuthUser.userId: number` unchanged (auth/api/types.ts) |
| `useLeaveTypes` | PASS | Still returns `{ data: leaveTypes }`; consumer signature unchanged |
| `useMyLeaveRequests` | PASS | Still returns `{ data: leaveRequests }`; filters by `r.userId === user.userId && r.status === "approved"` (same predicate as before) |
| `useSubmitLeaveRequest` | PASS | Still called as `submitLeaveRequest({ leaveTypeId: Number(data.leaveTypeId), startDate, endDate, totalDays, reason })` — same DTO shape as before |
| `useAuth.user.userId` | PASS | `AuthUser.userId: number` — old code also used `user.userId` (no change) |
| `CreateLeaveRequestDto` (types.ts) | PASS | `leaveTypeId: number` matches the `Number(data.leaveTypeId)` conversion at submit |

## Implementation Checks

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Zod `superRefine` ordering (presence → start<=end → past → overlap) | PASS | Lines 53–93: early return on missing dates, then `return` after each failure so later checks don't pile on the same form |
| 2. Schema re-created when `approvedDates` changes | PASS | Inline `zodResolver(createLeaveRequestSchema(approvedDates, today))` on line 135 — re-runs every render with the latest set; RHF uses the new resolver on next validation pass (documented pattern) |
| 3. `Controller` wired to shadcn `Select` | PASS | `value={field.value}` + `onValueChange={field.onChange}` (lines 188–189) |
| 4. `register` spread on `Input`s and `Textarea` | PASS | `…register("startDate")` (line 214), `…register("endDate")` (line 226), `…register("reason")` (line 245) |
| 5. `handleSubmit(onSubmit)` wrapping async submit | PASS | Line 259 `onClick={handleSubmit(onSubmit)}`; RHF prevents submit if validation fails, then calls `onSubmit(data)` with validated `data` |
| 6. API payload type matches `CreateLeaveRequestDto` | PASS | `leaveTypeId: Number(data.leaveTypeId)` (line 162) — explicit conversion handles the string-from-form → number-for-DTO transition; documented risk in phase-02.md and addressed |
| 7. Global `toast.error` removed for field-level errors | PASS | All 5 `toast.error` calls in the old submit handler are gone; only `toast.success` / `toast.error` for API result remain (lines 168, 170) |
| 8. No unused imports | PASS | `useState` removed; `useForm`, `Controller`, `zodResolver`, `z`, `useNavigate`, `useMemo`, all UI imports — all used |
| 9. Stale `hasOverlap` `useMemo` removed | PASS | Diff confirms `hasOverlap` block deleted; overlap is now exclusively in the Zod schema |
| 10. ESLint clean | PASS | `pnpm exec eslint src/features/leave-requests/components/leave-new-page.tsx` — no errors/warnings on the file (only pre-existing boundaries plugin warnings) |
| 11. TypeScript clean | PASS | Only the pre-existing `token-refresh.test.ts(110,37)` TS error (out of scope) |
| 12. `vite build` production build | PASS | `pnpm exec vite build` → `built in 11.72s`, no errors |

## Edge Cases Found by Scout

1. **Schema re-creation on every render**: Because `createLeaveRequestSchema(approvedDates, today)` is invoked inline in `useForm({ resolver: … })`, a new Zod schema is created every render. RHF re-uses the resolver between renders but re-validates with the new reference when needed. Acceptable for this form size; the `useMemo` memoization in the brainstorm was optional optimization and not a correctness requirement.

2. **Approval date `format` consistency**: `approvedDates` is built using `format(d, "yyyy-MM-dd")` (line 119) and the overlap check uses the same format (line 82). Verified — no timezone drift between build and check.

3. **Cross-field rule ordering is correct**: The first check (`startDate > endDate`) returns early so an inverted range does NOT also trigger "past" or "overlap" — clean UX, one error at a time per field.

4. **Empty-string `min(1)` for `startDate` / `endDate`**: An empty string from the date input is detected by `min(1)` in Zod, so the `superRefine` early-return at line 53 protects `parseISO` from throwing on `""`. Belt-and-braces — the native `<input type="date">` may also pass `""` for unset fields.

5. **`leaveTypeId` type preservation**: `<SelectItem value={String(t.id)}>` stores the id as a string in form state; the submit converts back to `Number` for the DTO. This is the standard RHF + shadcn pattern; `CreateLeaveRequestDto.leaveTypeId: number` requires the conversion.

6. **No `navigate` after success** (regression check): The OLD code called `navigate("/leave/my")` after a successful submit. The NEW code does NOT. This appears to be a deliberate change — the success flow is now "show toast" only. The user remains on the form. This is an intentional behavior change. See concern #1.

## Positive Observations

- Clean schema-driven design: all field rules live in one Zod schema, easy to audit
- Correct early-return pattern in `superRefine` — only one error at a time per field
- `today` captured at module level via `useMemo` not needed (computed once at render); correct that it's not memoized — string is cheap
- `min` attribute on native date inputs (`min={today}` for start, `min={startDateValue || today}` for end) gives browser-level guard in addition to Zod check
- Removed `hasOverlap` `useMemo` cleanly — overlap is now schema-only
- The `Number(data.leaveTypeId)` conversion is explicit and the only place where the string→number happens
- All API contracts preserved

## Concerns

### Concern 1 (low): Post-success navigation removed
**File**: `leave-new-page.tsx` lines 159–172
**Issue**: The original code called `navigate("/leave/my")` after a successful submit. The new code does not — the user stays on the form with a success toast. This is not mentioned in the plan/brainstorm, so it appears to be an unintended change or an undocumented intentional change.
**Impact**: Low — UX change. After submission, the user is not redirected. They could double-submit (no `isSubmitting` disable).
**Recommendation**: Decide explicitly. Either:
  - Add `navigate("/leave/my")` back (or to the list page) after `toast.success`, OR
  - Document this as an intentional change in the plan
  - Add a `disabled` state on the submit button while `submitLeaveRequest.isPending` to prevent double-clicks.

### Concern 2 (low): No `mode` or validation trigger on `useForm`
**File**: `leave-new-page.tsx` line 134
**Issue**: RHF default validation mode is `onSubmit`, so errors only show after the first failed submit. The native HTML5 `min` constraint on date inputs provides some pre-submit UX, but field errors (leaveTypeId, reason) only show after clicking "Gửi phê duyệt".
**Impact**: Low — meets acceptance criteria but slightly weaker UX than `mode: "onBlur"` or `mode: "onTouched"`.
**Recommendation**: Consider adding `mode: "onTouched"` to `useForm` config if the team wants immediate feedback. Not a blocker.

### Concern 3 (low): Schema instance recreated on every render
**File**: `leave-new-page.tsx` line 135
**Issue**: `zodResolver(createLeaveRequestSchema(approvedDates, today))` allocates a new Zod object on every render. With `useMemo` it'd be a micro-optimization; today it's not a perf issue at this scale, but it's worth noting.
**Impact**: Negligible performance impact (Zod schemas are cheap to construct; form is small).
**Recommendation**: Optional — wrap the schema in `useMemo(() => createLeaveRequestSchema(approvedDates, today), [approvedDates, today])`. The brainstorm mentioned this as a possible optimization. Not required.

## Recommended Actions (priority order)

1. (low) Decide on post-success navigation — restore `navigate(...)` or document the change
2. (low) Consider adding `mode: "onTouched"` to `useForm` for better UX
3. (optional) `useMemo` the schema if perf profiling later shows it

## Unresolved Questions

1. Was the removal of `navigate("/leave/my")` after successful submit intentional? Not mentioned in the plan or brainstorm.
2. Is there a reason `mode: "onTouched"` was not chosen (e.g., to avoid showing errors on initial mount)?
3. Should the success flow clear the form (`reset()`) so the user can submit another request, or is the toast + staying-on-page the intended UX?

## Final Verdict

**APPROVED_WITH_CONCERNS** — The refactor is functionally correct, scope-respecting, and meets all 11 acceptance criteria. The only outstanding concern is the unintentional-looking removal of post-success navigation (Concern 1), which is a low-severity UX regression. The build, lint, and TypeScript checks all pass on the modified file.

Build evidence: `vite build` succeeded (`built in 11.72s`).
Lint evidence: `pnpm exec eslint …/leave-new-page.tsx` — no errors.
TS evidence: `tsc --noEmit` — only the pre-existing `token-refresh.test.ts` error (out of scope).
