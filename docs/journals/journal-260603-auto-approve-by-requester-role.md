# Auto-Approve Levels by Requester Role

**Date**: 2026-06-03 09:30
**Severity**: High
**Component**: LeaveRequests — approval flow, balance deduction
**Status**: Resolved
**Branch**: feat/auto-approve-by-requester-role
**Plan**: plans/260603-0930-auto-approve-by-requester-role

## What Happened

Leader/Director/Admin tạo đơn xin nghỉ → kẹt pending mãi vì BR-07 cấm self-approve. Không thể tự duyệt đơn chính mình, đơn treo vô hạn. Fix: khi approver-role user gửi đơn, hệ thống auto-approve các cấp ≤ role họ. Staff vẫn pending như cũ.

## The Brutal Truth

Ngon nhất: không cần schema migration. ApprovedBy/ApprovedLevel/ApprovedAt đã tồn tại sẵn trên LeaveRequest entity. Tiết kiệm đống risk migration.

Phiền nhất: balance deduction logic bị duplicate giữa Create (auto-approve path) và Approve (manual path). Copy-paste = mồi inconsistency bug khi 1 path update, path kia quên. Extract ra ApprovalBalanceService cho DRY.

## Technical Details

ApprovalHelper.GetAutoApproveLevel trả 3 trạng thái:
- >0: highest matching level → auto-approve 1..N
- AutoApproveAll (-1): có approver role nhưng không match flow nào → auto-approve ALL
- 0: Staff, pending bình thường

Logic chính CreateLeaveRequestEndpoint:
```csharp
var autoLevel = ApprovalHelper.GetAutoApproveLevel(currentUser, flow);
if (autoLevel == ApprovalHelper.AutoApproveAll || (autoLevel > 0 && autoLevel >= maxLevel)) {
    entity.ApprovedLevel = maxLevel;
    entity.Status = "approved";
    entity.ApprovedBy = currentUser.UserId;
    entity.ApprovedAt = DateTime.UtcNow;
} else if (autoLevel > 0) {
    entity.ApprovedLevel = autoLevel; // partial, higher levels remain
}
```
Balance deduction chạy cùng transaction khi fully approved: ApprovalBalanceService.UpsertBalanceForApprovalAsync. Allow over-limit (UsedDays có thể âm).

Key files: ApprovalHelper.cs (modify), ApprovalBalanceService.cs (new), CreateLeaveRequestEndpoint.cs (modify), ApproveLeaveRequestEndpoint.cs (modify).

## What We Tried

1. Sentinel -1 cho "auto-approve ALL" — chọn. XML doc + AutoApproveAll constant tránh magic number rải rác.
2. Extract balance service — chọn. DRY, Approve manual path dùng lại cùng service.

## Root Cause Analysis

Design flaw ban đầu: BR-07 (cấm self-approve) không có exception clause cho approver-role user tự nghỉ. Lược bỏ case "người có quyền duyệt tự nghỉ". Auto-approve patch vá lỗ hổng mà không phá BR-07 cho case Staff duyệt đơn người khác.

## Lessons Learned

- Sentinel value + constant + XML doc: -1 dễ hiểu sai khi rải code. Đóng gói AutoApproveAll + doc 3-trạng thái = self-documenting.
- Extract shared logic sớm: balance logic duplicate 2 chỗ đã đủ justify extract. Đừng đợi 3+ chỗ.
- Check field tồn tại trước khi plan migration: 3 field đã có → tiết kiệm phase migration. Scout-first.
- Partial auto-approve đúng: Director duyệt NPN (2 cấp L,D) → matchLevel=2=max → approved. Director NKL (1 cấp L) → matchLevel=0, approver role → auto-all → approved. Khớp bảng scenario.

## Next Steps

- Blocks plan 260603-0826-approvable-requests-api: auto-approve thay đổi approval flow, plan kia phải account cho auto-approved requests trong filtering. Commit eb6ad48 sửa ListApprovableRequestsEndpoint 58 dòng — verify đã handle.
- Cross-plan shared file ApprovalHelper.cs: cả 2 plan sửa, merge cùng commit, không conflict.
