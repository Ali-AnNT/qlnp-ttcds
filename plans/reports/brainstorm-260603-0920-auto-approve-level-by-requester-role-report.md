# Brainstorm: Auto-Approve Levels by Requester Role

**Date:** 2026-06-03
**Status:** Concluded → proceeding to /ck:plan

## Problem Statement

Khi Leader (QLNP.LD.PCM) hoặc Director (QLNP.GD.PGD) gửi đơn xin nghỉ, đơn kẹt ở pending vì BR-07 cấm self-approve. Không ai duyệt level 1 cho Leader's own request.

## Decisions Made

| # | Question | Decision |
|---|----------|----------|
| 1 | Auto-approve scope | Tự động duyệt mọi cấp ≤ cấp của người gửi. Nếu không match config nhưng CÓ approver role → auto-all |
| 2 | Phạm vi loại nghỉ | Tất cả loại nghỉ (uniform) |
| 3 | Audit trail | ApprovedBy = người gửi đơn, ApprovedAt = thời điểm tạo |
| 4 | Director + 1-level config | Không match → có approver role → auto-approve all → approved |
| 5 | Allow create roles | Tất cả roles (Staff, Leader, Director, Admin) |
| 6 | Zero LeaveConfig | Block tạo đơn (giữ 403 behavior hiện tại) |

## Final Logic

```
1. Build approval flow từ LeaveConfig
2. Tìm matchLevel = highest level where requester.Roles ∩ flow[level].roles ≠ ∅
3. Nếu matchLevel > 0:
   → Auto-approve levels 1..matchLevel
   → matchLevel == maxLevel → approved, trừ balance
   → matchLevel < maxLevel → pending, đợi levels còn lại
4. Nếu matchLevel == 0:
   → Requester có approver role (Leader/Director/Admin) → auto-approve ALL → approved
   → Requester chỉ Staff → pending (đợi duyệt bình thường)
5. Nếu LeaveType không có LeaveConfig → block tạo đơn (403)
```

## Scenarios

| Requester | LeaveType | Config | matchLevel | Result |
|-----------|-----------|--------|-----------|--------|
| Staff | NPN | 1:Leader, 2:Director | 0, Staff | pending (đợi L+D) |
| Leader | NPN | 1:Leader, 2:Director | 1 | pending L1, đợi D cấp 2 |
| Leader | NKL | 1:Leader | 1=max | approved |
| Director | NPN | 1:Leader, 2:Director | 2=max | approved |
| Director | NKL | 1:Leader | 0, có role D | approved (auto-all) |
| Admin | any | any | 0, có role | approved (auto-all) |

## Chosen Approach: B (Extracted Service)

- `GetAutoApproveLevel` vào `ApprovalHelper.cs`
- `ApprovalBalanceService.cs` extract từ Approve endpoint
- Create endpoint gọi helper sau save
- Approve endpoint dùng shared service

### Files Changed

| File | Action | Description |
|------|--------|-------------|
| `Shared/Domain/ApprovalHelper.cs` | Modify | Thêm `GetAutoApproveLevel` |
| `Shared/Domain/ApprovalBalanceService.cs` | Create | Extract balance logic |
| `Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs` | Modify | Auto-approve sau save, thêm roles |
| `Features/LeaveRequests/Approve/ApproveLeaveRequestEndpoint.cs` | Modify | Dùng shared balance service |

### No schema changes needed — ApprovedBy/ApprovedLevel/ApprovedAt exist

## Risks

| Risk | Level | Mitigation |
|------|-------|-----------|
| Director/Admin tự approve đơn mình | LOW | Yêu cầu — cấp trên không cần ai duyệt |
| Balance deducted sai | MEDIUM | Dùng chung ApprovalBalanceService |
| Race condition auto + manual approve | LOW | 1 transaction trong Create |
| Frontend chưa handle approved ngay sau tạo | LOW | DTO đủ fields |
| Zero LeaveConfig | HANDLED | Block tạo đơn (403) |

## Unresolved Questions

None — all decisions captured.