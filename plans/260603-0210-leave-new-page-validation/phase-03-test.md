---
phase: 3
title: "Testing & Validation"
status: pending
priority: P2
effort: "1h"
dependencies: ["2"]
---

# Phase 3: Testing & Validation

## Overview
Perform manual checks to verify validation logic, UX compliance, and error message styling.

## Requirements
- Functional:
  - Form must prevent submission if validations fail.
  - Overlap check should block dates matching approved dates of the same user.
- Non-functional:
  - Validations must not block valid submissions.
  - Error messages must look visually aligned with the rest of the application layout.

## Related Code Files
- None (NEVER write tests as per project rules. The tester agent handles automated tests. All verification in this phase is manual).

## Implementation Steps
1. Run application locally using the development server: `npm run dev` (or equivalent).
2. Go to the new leave request page (`/leave/new` or similar UI route).
3. Test case: Empty fields validation.
   - Click "Gửi phê duyệt" without filling anything.
   - Verify that error messages appear under all required fields: Select Type, Start Date, End Date, Reason.
4. Test case: Date logic validation.
   - Select a Start Date in the past. Verify "Không được chọn ngày trong quá khứ" appears under Start Date.
   - Select an End Date before the Start Date. Verify "Ngày bắt đầu phải trước hoặc trùng ngày kết thúc" appears under End Date.
5. Test case: Reason field validation.
   - Fill reason with only spaces (`"   "`). Verify validation error displays "Lý do nghỉ không được chỉ chứa khoảng trắng".
6. Test case: Overlap date check validation.
   - Identify an already approved leave request date for the active user.
   - Select start/end dates that overlap with that approved date.
   - Verify error "Khoảng ngày nghỉ trùng với đơn đã được duyệt" displays under Start Date.
7. Test case: Successful submission.
   - Fill valid future dates, valid reason, choose a leave type.
   - Submit and verify the success toast displays, and the payload values sent to the API are correct.

## Success Criteria
- [ ] Visual validations show red messages below incorrect input fields.
- [ ] Dynamic day calculation accurately reflects count of business days selected.
- [ ] No global `toast.error` for form-level input validations.
- [ ] Successful submission behaves identically to the original form logic.

## Risk Assessment
- *Risk*: Incorrect business days calculation when start/end dates are invalid or incomplete.
- *Mitigation*: Ensure the calculation guards against invalid inputs and only computes business days when valid dates are selected.
