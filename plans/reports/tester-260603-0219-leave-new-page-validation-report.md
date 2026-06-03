---
title: "Leave New Page Validation — Tester Report"
date: 2026-06-03T02:19
phase: 3
status: PASS
work-context: /home/vif/qlnp-ttcds
modified-file: packages/web/src/features/leave-requests/components/leave-new-page.tsx
---

# Leave New Page Validation — Verification Report

## 1. Compile / Build Status

| Check | Status | Notes |
|-------|--------|-------|
| `tsc --noEmit -p tsconfig.app.json` (in-scope) | ✅ | No errors in `leave-new-page.tsx` or `leave-requests/components/*` |
| Pre-existing `token-refresh.test.ts(110,37)` TS2345 | ⚠️ Out of scope | Not touched by this refactor |
| `eslint src/features/leave-requests/components/leave-new-page.tsx` | ✅ | Only generic boundaries/entry-point deprecation warnings, not from our file |
| `vite build` | ✅ | Built in 10.51s, 3436 modules transformed, no errors |
| `pnpm test` (35 tests across 5 files) | ✅ | All 35 tests passed in 3.04s — no regressions |

Diff-aware filter: `tsc ... | grep -E "leave-new-page|leave-requests/components"` returned **no output** (clean).

## 2. Static Inspection of Refactored File

| # | Check | Status | Evidence (file:line) |
|---|-------|--------|----------------------|
| 1 | `leaveTypeId` non-empty (min 1) | ✅ | `leave-new-page.tsx:40` — `z.string().min(1, "Vui lòng chọn loại phép")` |
| 2 | `startDate` non-empty | ✅ | `leave-new-page.tsx:41` — `z.string().min(1, "Vui lòng chọn ngày bắt đầu")` |
| 3 | `endDate` non-empty | ✅ | `leave-new-page.tsx:42` — `z.string().min(1, "Vui lòng chọn ngày kết thúc")` |
| 4 | `reason` non-empty | ✅ | `leave-new-page.tsx:45` — `z.string().min(1, "Vui lòng nhập lý do")` |
| 5 | `reason` rejects whitespace-only | ✅ | `leave-new-page.tsx:46-49` — `.refine(val => val.trim().length > 0, "Lý do nghỉ không được chỉ chứa khoảng trắng")` |
| 6 | `superRefine` order: end>=start → start>=today → overlap | ✅ | `leave-new-page.tsx:56-72` (checks 1 & 2 in order) then `76-90` (overlap). `return` after each short-circuits subsequent checks. |
| 7 | End-before-start attaches error to `path: ["endDate"]` | ✅ | `leave-new-page.tsx:60` |
| 8 | Past-date attaches to `path: ["startDate"]` | ✅ | `leave-new-page.tsx:70` |
| 9 | Overlap attaches to `path: ["startDate"]` | ✅ | `leave-new-page.tsx:88` |
| 10 | Select wrapped in `<Controller name="leaveTypeId">` | ✅ | `leave-new-page.tsx:183-203` — `<Controller name="leaveTypeId" control={control} render={({ field }) => <Select ... value={field.value} onValueChange={field.onChange}>` |
| 11 | `register("startDate")` spread on right input | ✅ | `leave-new-page.tsx:214` — `<Input type="date" min={today} {...register("startDate")} />` |
| 12 | `register("endDate")` spread on right input | ✅ | `leave-new-page.tsx:226` — `<Input type="date" min={startDateValue || today} {...register("endDate")} />` |
| 13 | `register("reason")` spread on right input | ✅ | `leave-new-page.tsx:245` — `<Textarea {...register("reason")} ... />` |
| 14 | `onSubmit` payload matches `CreateLeaveRequestDto` | ✅ | `leave-new-page.tsx:161-167` — submits `{ leaveTypeId: Number(...), startDate, endDate, totalDays: days, reason }`. Matches `CreateLeaveRequestDto` (`api/types.ts:25-31`) — `leaveTypeId:number`, `startDate:string`, `endDate:string`, `reason?:string`, `totalDays?:number`. |
| 15 | `useAuth` resolves to `AuthContext` (type-safe) | ✅ | `leave-new-page.tsx:99` — `const { user } = useAuth()`. Resolved via `@/features/auth` → `hooks/use-auth` → `contexts/auth-context.tsx:27` |
| 16 | `useLeaveTypes` / `useMyLeaveRequests` / `useSubmitLeaveRequest` exported with expected signatures | ✅ | `hooks/use-leave-types.ts:6`, `hooks/use-leave-requests.ts:17,35` |

### 2.1 Dependency Type Compatibility

- `zodResolver(createLeaveRequestSchema(approvedDates, today))` — type aligns: `LeaveRequestForm = z.infer<ReturnType<typeof createLeaveRequestSchema>>` (line 96) — resolver re-evaluated per render so RHF re-validates with current `approvedDates`/`today` (line 135).
- `useForm<LeaveRequestForm>` — RHF generic matches the schema's inferred type.
- `Controller` import — from `react-hook-form` (line 3) — required for shadcn `Select` which is not a native form input.

### 2.2 Behavior Notes (not bugs, just facts)

- `days` uses `Math.max(1, differenceInBusinessDays(end, start) + 1)` (lines 150-156). When start === end, `differenceInBusinessDays` returns 0 → day count = 1 (correct). When start > end, the guard on line 149 returns 0 (correct).
- `today` is captured **once at render** (line 105). If the form is left open across midnight, validation re-runs only when the form re-renders. Acceptable for this UI flow.
- `approvedDates` `useMemo` recomputes when `leaveRequests` or `user` changes (line 126). Form's resolver is recreated per render (line 135) so the latest `approvedDates` is fed in.
- Successful submit toasts `"Đã gửi phê duyệt"` and `useSubmitLeaveRequest` invalidates `["leave-requests"]` and `["leave-balances"]` (hook line 44-45). No redirect — only the toast signals success.

## 3. Test Files — Creation Audit

Per project rule: NEVER write new automated tests for this task.

| Pattern | Files in `packages/web` | Newly created/modified for this refactor? |
|---------|--------------------------|--------------------------------------------|
| `*.test.ts` / `*.test.tsx` | 5 files: `token-store`, `leave-types.api`, `token-refresh`, `auth.api`, `client` | No — `git status` shows zero test-file changes for this refactor |
| New tests in `__tests__/` | None | No |

**Verdict:** No tests created or modified. Project rule respected.

## 4. Manual Test Plan — Mapping Phase 3 Steps to Code

> The human reviewer will run the app via `pnpm --filter @qlnp/web dev` (or `cd packages/web && pnpm dev`) and visit the new leave request page (route registered in `packages/web/src/app/router.tsx`).

| Phase 3 Step | User Action | Expected Behavior | Expected Error Message (Vietnamese) | Code Reference |
|--------------|-------------|--------------------|-------------------------------------|----------------|
| 3 (empty fields) | Click "Gửi phê duyệt" with everything blank | Inline errors appear under **all 4** fields | `Vui lòng chọn loại phép` / `Vui lòng chọn ngày bắt đầu` / `Vui lòng chọn ngày kết thúc` / `Vui lòng nhập lý do` | lines 40, 41, 42, 45 |
| 4a (past start date) | Pick a Start Date < today | Error under Start Date | `Không được chọn ngày trong quá khứ` (path: `startDate`) | line 69 |
| 4b (end before start) | Pick End Date < Start Date | Error under End Date | `Ngày bắt đầu phải trước hoặc trùng ngày kết thúc` (path: `endDate`) | line 59 |
| 5 (whitespace reason) | Reason = `"   "` (only spaces) | Error under Reason | `Lý do nghỉ không được chỉ chứa khoảng trắng` | line 48 |
| 6 (overlap) | Pick range that overlaps an approved request for the same user | Error under Start Date | `Khoảng ngày nghỉ trùng với đơn đã được duyệt` (path: `startDate`) | line 87 |
| 7 (success) | Valid future range + valid reason + leave type chosen | Toast appears, API called with correct payload | Toast: `Đã gửi phê duyệt`; payload: `{ leaveTypeId: number, startDate: "yyyy-MM-dd", endDate: "yyyy-MM-dd", totalDays: number, reason: string }` | lines 161-168 |

### 4.1 Additional Visual / UX Checks (not in Phase 3 explicitly but worth confirming)

| Concern | Where to look |
|---------|---------------|
| Day count display hidden when `days === 0` | line 236 `{days > 0 && (...)}` — only shows after valid range selected |
| Min-attr on endDate tracks startDate | line 225 — `min={startDateValue || today}` so browser-native picker nudges the user |
| Cancel button | line 263 — `navigate(-1)` (does NOT submit) |
| No global `toast.error` for form-level errors | confirmed — `onSubmit` catch (line 169) only fires for API errors, not for validation |

## 5. Risks & Notes

- **None blocking.** All compile/build/lint/test signals are green for the in-scope file.
- The pre-existing `token-refresh.test.ts(110,37)` TS2345 was present before this refactor and is unrelated. Mention only — do not fix in this scope.
- Resolver is re-evaluated on every render (line 135) — fine for an in-memory Set of approved dates, no perf concern at expected scale.
- `useSubmitLeaveRequest` only invalidates `leave-requests` and `leave-balances` query keys; if the leave-balance UI lives outside those keys, the cache will go stale. Pre-existing behavior — not in scope.

## 6. Final Verdict

**PASS**

- Compile/build/lint/test: all green for in-scope code
- Static inspection: all 16 design-rule checks satisfied
- Project rule (no new tests): respected
- Manual test plan: 7 step rows + 3 UX checks mapped to exact code paths and expected messages

The refactor is ready for human-run browser verification of the 7 manual test cases above.

---

**Status:** DONE
**Summary:** Static + build verification passes for the RHF/Zod refactor of `leave-new-page.tsx`. All 16 design-rule checks satisfied. Manual test plan mapped to code with exact expected error messages.
**Concerns/Blockers:** None.
