# Brainstorm Report: Approvable Requests API

## Problem Statement

FE `approval-page.tsx` hiện:
1. Gọi `GET /leave-requests?status=pending` → lấy TẤT CẢ pending requests
2. Gọi `GET /system-configs/leave-configs` → lấy TẤT CẢ configs
3. Build `flowByType` (Map<leaveTypeId, Map<level, roles[]>>) trên client
4. Filter: chỉ giữ requests mà `user.role ∈ flowByType[leaveTypeId][approvedLevel+1]` + Leader không duyệt đơn mình

**Issues:** lộ data, duplicate logic với BE `ApprovalHelper.CanApproveAtLevel`, 2 API calls khi chỉ cần 1, không scalable.

## Evaluated Approaches

### A: Single-query endpoint ✅ CHOSEN
- GET `/leave-requests/approvable` — BE filter bằng `ApprovalHelper.CanApproveAtLevel`
- 1 API call, tận dụng logic đã có
- Trả về `List<LeaveRequestDto>` (cùng shape hiện tại)

### B: Config-cached endpoint
- Load ALL configs 1 lần, build flow cache, filter per request
- Tối ưu hơn khi nhiều requests cùng leave type
- Phức tạp hơn A, premature optimization

### C: Rich DTO endpoint
- Trả về DTO mở rộng kèm approval metadata (nextLevel, maxLevel, canApprove, approvalStatusLabel)
- FE không cần config call, có đủ thông tin hiển thị
- Phức tạp nhất, over-engineering cho nhu cầu hiện tại

**Decision:** Approach A — KISS. Logic filter đã có sẵn ở `ApprovalHelper`. Không cần DTO mới hay config cache.

## Final Design

### Backend: `Features/LeaveRequests/Approvable/ListApprovableRequestsEndpoint.cs`

**Route:** `GET /leave-requests/approvable`
**Auth:** RequireAuthorization + Roles(Leader, Director, Admin)

**Flow:**
1. `CurrentUser.GetCurrentUser()` — get user info (roles, PhongBanId, UserId)
2. Query `Db.LeaveRequests.Where(lr => lr.Status == "pending")` — initial scope
3. Role-based pre-filter (existing pattern from `ListLeaveRequestsEndpoint`):
   - Admin/Director: all pending
   - Leader: same PhongBanId only
   - Staff: none (empty result)
4. For each request: load configs for `LeaveTypeId`, build flow, check `ApprovalHelper.CanApproveAtLevel`
5. Filter out requests where `canApprove == false`
6. Batch load user info via `LeaveRequestUserLookup.LoadUserInfoBatchAsync`
7. Map to `LeaveRequestDto`, return `Result<List<LeaveRequestDto>>.Ok(items)`

**Reuse:** `ApprovalHelper.CanApproveAtLevel()`, `LeaveRequestUserLookup.LoadUserInfoBatchAsync()`, `LeaveRequest.MapToDto()`

### Frontend Changes

1. **New hook:** `use-approvable-requests.ts` — `useQuery({ queryKey: ["leave-requests", "approvable"], queryFn: ... })`
2. **Remove:** `use-approval-configs.ts` (no longer needed for filtering)
3. **Simplify:** `approval-page.tsx` — remove `visibleRequests` useMemo, remove departments query, remove config query
4. **Remove:** `approval.api.ts` barrel re-export (inline `leaveRequestsApi` import)
5. **Keep:** `approval-table.tsx`, `reject-dialog.tsx`, `detail-dialog.tsx` — mostly unchanged
6. **Consider:** departments still needed for display in table/detail — keep departments query in `approval-page.tsx`

### Files to Create
- `packages/api/Features/LeaveRequests/Approvable/ListApprovableRequestsEndpoint.cs`

### Files to Modify
- `packages/web/src/features/approval/hooks/use-approvable-requests.ts` (new)
- `packages/web/src/features/approval/components/approval-page.tsx` (simplify)
- `packages/web/src/features/approval/api/approval.api.ts` (update or remove)
- `packages/web/src/features/approval/hooks/use-approval-configs.ts` (remove if unused elsewhere)
- `packages/web/src/features/approval/hooks/use-approval-requests.ts` (remove)

### Files to Keep Unchanged
- `approval-table.tsx`, `reject-dialog.tsx`, `detail-dialog.tsx`
- `use-approval-actions.ts` (approve/reject mutations)

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| N+1 query (1 config query per request) | Acceptable for now — pending requests typically <50. Can optimize later with approach B if needed |
| `LeaveRequestGroup` route conflict with `approvable` | Use `Get("approvable")` before other GET routes — FastEndpoints processes in registration order |
| Staff users calling endpoint | Auth check returns empty list immediately |

## Success Criteria
- API returns only requests the current user can approve (verified by role + dept + config)
- FE approval page works with single API call
- Leader cannot see their own requests or requests from other departments
- No `useApprovalConfigs` hook needed in approval page