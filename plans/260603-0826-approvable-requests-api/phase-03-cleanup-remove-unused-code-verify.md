---
phase: 3
title: "Cleanup: Remove unused code + verify"
status: pending
priority: P2
effort: "30m"
dependencies: [2]
---

# Phase 3: Cleanup — Remove unused code + verify

## Overview

Xóa code thừa sau khi FE đã chuyển sang dùng `useApprovableRequests`. Dọn dẹp hooks, API barrel, và verify end-to-end.

## Requirements

- Xóa các file/hook không còn được sử dụng
- Verify compile FE + BE
- Verify approval page hoạt động đúng end-to-end

## Related Code Files

- **Delete:** `packages/web/src/features/approval/hooks/use-approval-requests.ts` (replaced by use-approvable-requests)
- **Delete:** `packages/web/src/features/approval/api/approval.api.ts` (no longer needed — hooks import directly from leave-requests feature)
- **Check:** `packages/web/src/features/approval/hooks/use-approval-configs.ts` — **KEEP** (still needed for maxLevelByType display label)
- **Verify:** `packages/web/src/features/approval/index.ts` — update exports if needed

## Implementation Steps

1. Check all imports of `use-approval-requests` and `approval.api` across the codebase:
   ```bash
   grep -r "use-approval-requests\|useApprovalRequests\|approval\.api" packages/web/src/ --include="*.ts" --include="*.tsx"
   ```

2. Delete `use-approval-requests.ts` — confirmed only used by approval-page (replaced in Phase 2)

3. Delete `approval.api.ts` — confirmed only barrel re-export of `leaveRequestsApi` (no longer needed)

4. Verify `approval/index.ts` exports are correct after changes:
   - Keep: `ApprovalPage` export
   - Remove: any re-exports of deleted files

5. Build BE:
   ```bash
   cd packages/api && dotnet build
   ```

6. Build FE:
   ```bash
   cd packages/web && pnpm build
   ```

7. Manual smoke test (if dev server available):
   - Login as Director → verify sees all pending requests
   - Login as Leader → verify sees only requests from same department at their approval level
   - Approve a request → verify list refreshes
   - Reject a request → verify list refreshes
   - Login as Staff → verify no approval page access (403)

## Success Criteria

- [ ] `use-approval-requests.ts` deleted
- [ ] `approval.api.ts` deleted
- [ ] No dangling imports referencing deleted files
- [ ] BE compiles without errors
- [ ] FE compiles without errors (TypeScript + Vite)
- [ ] Approval page renders correctly for Director role
- [ ] Approval page renders correctly for Leader role (scoped by department)
- [ ] Staff role cannot access approval page

## Risk Assessment

| Risk | Mitigation |
|------|-------------|
| Other files may import from deleted modules | grep before delete — only delete if no other consumers |
| `use-approval-configs` might seem deletable but isn't | Keep it — needed for `maxLevelByType` display label |

## Next Steps

- Consider Phase 4 (optional): Optimize N+1 query in BE by batch-loading LeaveConfigs per leave type
- Consider: Add `maxApprovalLevel` to LeaveRequestDto to eliminate the remaining config call on FE