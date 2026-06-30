# Plan — Fix leaveTypesApi.update truyền full object

## Context
- Backend `UpdateLeaveTypeRequest` yêu cầu full object (Name, Code, DefaultDays, Description, IsActive). Validator ép NotEmpty/GreaterThan(0).
- Frontend `leaveTypesApi.update` type `Partial<LeaveTypeDto>` — quá lỏng, compiler không chặn.
- `toggleMutation` chỉ truyền `{ isActive }` → backend reject 400.
- User chốt: merge full object ở frontend, đổi type sang `Omit<LeaveTypeDto,"id">`, scope chỉ leaveTypesApi.update + toggle.

## Phases
- **phase-01-fix-api-type-and-toggle.md** — Sửa api type + toggleMutation merge cache. Status: completed.
- **phase-02-update-test.md** — Cập nhật test truyền full object. Status: completed.

## Touchpoints
- `packages/web/src/features/config/api/leave-types.api.ts`
- `packages/web/src/features/config/hooks/use-leave-types.ts`
- `packages/web/src/test/leave-types.api.test.ts`

## Acceptance
1. Toggle active/inactive không lỗi 400 (gửi full object).
2. Edit/save leave type vẫn hoạt động.
3. Compiler chặn caller `leaveTypesApi.update` thiếu field.
4. Test pass.

## Constraints
- Không động backend.
- Không phá public contract (ngoại trừ `update` type — chủ đích).
- KISS/YAGNI.