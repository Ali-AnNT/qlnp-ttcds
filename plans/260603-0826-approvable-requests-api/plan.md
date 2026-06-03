---
title: "Approvable Requests API — Move approval filtering from FE to BE"
description: >
  Tạo endpoint GET /api/leave-requests/approvable — BE filter requests theo approval config + role + dept.
  FE chỉ gọi 1 API, bỏ useApprovalConfigs + visibleRequests useMemo. Dọn dẹp code thừa.
status: pending
priority: P2
branch: "dev"
tags: [backend, frontend, approval, refactor]
blockedBy: []
blocks: []
created: "2026-06-03T08:34:58.388Z"
createdBy: "ck:plan"
source: skill
brainstorm: plans/260603-0826-approvable-requests-api/brainstorm-report.md
---

# Approvable Requests API — Move approval filtering from FE to BE

## Overview

FE `approval-page.tsx` đang filter approval visibility trên client (2 API calls + complex useMemo). Chuyển logic xuống BE: endpoint mới `GET /api/leave-requests/approvable` trả về chỉ những đơn current user có quyền duyệt. FE simplified: 1 API call, no client-side filtering.

## Problem

- Lộ data: Leader thấy requests từ phòng ban khác (filter trên FE)
- Logic nghiệp vụ duplicate: FE `visibleRequests` useMemo vs BE `ApprovalHelper.CanApproveAtLevel`
- 2 API calls khi chỉ cần 1
- Không scalable khi thêm approval rules mới

## Solution (Approach A — Single-query endpoint)

- BE: `GET /api/leave-requests/approvable` — query pending requests, filter bằng `ApprovalHelper.CanApproveAtLevel`
- Reuse: `ApprovalHelper`, `LeaveRequestUserLookup`, `LeaveRequestMapping`
- FE: 1 hook `useApprovableRequests`, xóa `useApprovalConfigs`, `useApprovalRequests`, simplify `approval-page.tsx`

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Backend: Create ListApprovableRequestsEndpoint](./phase-01-backend-create-listapprovablerequestsendpoint.md) | Pending |
| 2 | [Frontend: New hook + simplify approval-page](./phase-02-frontend-new-hook-simplify-approval-page.md) | Pending |
| 3 | [Cleanup: Remove unused code + verify](./phase-03-cleanup-remove-unused-code-verify.md) | Pending |

## Dependencies

None. This plan is self-contained.