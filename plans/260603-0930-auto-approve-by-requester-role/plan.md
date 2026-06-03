---
title: "Auto-Approve Levels by Requester Role"
description: >
  Khi người có role approver (Leader/Director/Admin) gửi đơn xin nghỉ,
  tự động approve các cấp ≤ role của người gửi. Nếu không match config nào
  nhưng có approver role → auto-approve tất cả. Staff → pending như cũ.
status: done
priority: P2
branch: "feat/auto-approve-by-requester-role"
tags: [backend, approval, auto-approve]
blockedBy: []
blocks: ["plans/260603-0826-approvable-requests-api"]
created: "2026-06-03T09:25:24.649Z"
createdBy: "ck:plan"
source: skill
brainstorm: plans/reports/brainstorm-260603-0920-auto-approve-level-by-requester-role-report.md
---

# Auto-Approve Levels by Requester Role

## Overview

Khi Leader/Director/Admin gửi đơn xin nghỉ, hệ thống auto-approve các cấp ≤ role của người gửi. Nếu role không match config nào nhưng là approver role → auto-approve tất cả → approved ngay. Staff tạo đơn → pending như cũ (đợi duyệt bình thường).

**Problem:** Hiện tại Leader gửi đơn → kẹt pending vì BR-07 cấm self-approve. Director/Admin cũng kẹt tương tự.

**Solution:** Thêm `GetAutoApproveLevel` vào `ApprovalHelper`, extract balance logic vào shared service, update Create endpoint để auto-approve sau khi tạo đơn.

## Business Rules

| # | Rule |
|---|------|
| 1 | matchLevel = highest level where requester.Roles ∩ flow[level].roles ≠ ∅ |
| 2 | matchLevel > 0 → auto-approve 1..matchLevel; nếu matchLevel=maxLevel → approved + deduct balance |
| 3 | matchLevel == 0 + requester có approver role → auto-approve ALL → approved + deduct balance |
| 4 | matchLevel == 0 + requester chỉ Staff → pending (như hiện tại) |
| 5 | Zero LeaveConfig cho LeaveType → block tạo đơn (403) |
| 6 | ApprovedBy = requester.UserId, ApprovedAt = creation time |
| 7 | All roles (Staff/Leader/Director/Admin) được tạo đơn |

## Scenarios

| Requester | LeaveType | Config | matchLevel | Result |
|-----------|-----------|--------|-----------|--------|
| Staff | NPN | 1:L, 2:D | 0, Staff | pending |
| Leader | NPN | 1:L, 2:D | 1 | pending (đợi D) |
| Leader | NKL | 1:L | 1=max | approved |
| Director | NPN | 1:L, 2:D | 2=max | approved |
| Director | NKL | 1:L | 0, D role | approved (auto-all) |
| Admin | any | any | 0, Admin | approved (auto-all) |

## Phases

| Phase | Name | Status | Dependencies | Effort |
|-------|------|--------|-------------|--------|
| 1 | [Research](./phase-01-research.md) | Done | — | 15min |
| 2 | [Implement ApprovalHelper](./phase-02-implement-approvalhelper.md) | Done | Phase 1 | 30min |
| 3 | [Extract Balance Service](./phase-03-extract-balance-service.md) | Done | Phase 1 | 20min |
| 4 | [Update Create Endpoint](./phase-04-update-create-endpoint.md) | Done | Phase 2, 3 | 30min |
| 5 | [Update Approve Endpoint](./phase-05-update-approve-endpoint.md) | Done | Phase 3 | 10min |
| 6 | [Test](./phase-06-test.md) | Done | Phase 2-5 | 30min |

## Dependencies

### Cross-Plan

- **Blocks:** `plans/260603-0826-approvable-requests-api` — auto-approve thay đổi approval flow, approvable-requests-api plan cần account cho auto-approved requests trong filtering logic
- **Shared files:** `ApprovalHelper.cs` (both plans modify)

### No Schema Changes

ApprovedBy, ApprovedLevel, ApprovedAt fields đã tồn tại trên LeaveRequest entity. Không cần migration.

## Key Files

| File | Action |
|------|--------|
| `packages/api/Shared/Domain/ApprovalHelper.cs` | Modify |
| `packages/api/Shared/Domain/ApprovalBalanceService.cs` | Create |
| `packages/api/Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs` | Modify |
| `packages/api/Features/LeaveRequests/Approve/ApproveLeaveRequestEndpoint.cs` | Modify |