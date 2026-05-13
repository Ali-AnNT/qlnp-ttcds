---
day: 3
phase: Leave APIs
status: pending
effort: 1 day
priority: P0
---

# Day 3: Leave Types + Leave Requests + Leave Balances APIs

## Context

**Depends on:** Day 2 (auth + core APIs)

## Overview

Implement các API cho loại phép, đơn xin nghỉ (role-based filtering), số dư phép.

## Tasks

### 3.1 Leave Type Endpoints

- [ ] `Endpoints/LeaveTypeEndpoints.cs`
  - `GET /api/leave-types` — list active
  - `POST /api/leave-types` — create (QTHT only)
  - `PUT /api/leave-types/{id}` — update (QTHT only)
  - `DELETE /api/leave-types/{id}` — soft delete set is_active=0 (QTHT only)

### 3.2 Leave Request Service

- [ ] `Services/LeaveRequestService.cs`
  - `GetAll(userId, role, deptId)` — role-based filtering:
    - CB.PCM → chỉ request của mình
    - LD.PCM → request của department
    - GD.PGD/QTHT → tất cả
  - `GetById(id)` — single request
  - `Create(request)` — kiểm tra số dư phép, validate dates, insert
  - `Approve(id, approverId)` — state machine:
    - pending → LD duyệt → `approved_leader`
    - `approved_leader` → GĐ duyệt → `approved_director`
    - Nếu approver là GD.PGD: skip LD → direct `approved_director`
  - `Reject(id, approverId, reason)` — set status `rejected`
  - `Cancel(id, userId)` — chỉ chủ đơn hoặc QTHT được hủy
  - `Delete(id)` — QTHT only, hard delete

### 3.3 Leave Request Endpoints

- [ ] `Endpoints/LeaveRequestEndpoints.cs`
  - `GET /api/leave-requests` — role-based list (query: status, year, employee_id filter)
  - `GET /api/leave-requests/{id}` — single
  - `POST /api/leave-requests` — tạo đơn mới
  - `PUT /api/leave-requests/{id}` — update nếu còn pending
  - `PUT /api/leave-requests/{id}/approve` — phê duyệt
  - `PUT /api/leave-requests/{id}/reject` — từ chối + lý do
  - `PUT /api/leave-requests/{id}/cancel` — hủy
  - `DELETE /api/leave-requests/{id}` — xóa (QTHT)

### 3.4 Leave Balance Endpoints

- [ ] `Endpoints/LeaveBalanceEndpoints.cs`
  - `GET /api/leave-balances` — tất cả (GD.PGD, QTHT), filter theo year, dept
  - `GET /api/leave-balances/my` — số dư của current user
  - `GET /api/leave-balances/{employeeId}` — số dư của 1 nhân viên

### 3.5 Balance Calculation Service

- [ ] `Services/LeaveBalanceService.cs`
  - `CalculateBalance(employeeId, year)` — tính toán từ leave_types.default_days + leave_requests đã approved
  - `UpdateUsedDays(employeeId, leaveTypeId, year)` — cập nhật sau mỗi lần approve/cancel

## Delivery

- [ ] Tạo đơn xin nghỉ, phê duyệt 2 cấp thành công
- [ ] Balance tính đúng sau approve/reject/cancel
- [ ] Role-based filtering trả về đúng data

## Files to Create

| File | Purpose |
|------|---------|
| `Endpoints/LeaveTypeEndpoints.cs` | Leave type CRUD |
| `Endpoints/LeaveRequestEndpoints.cs` | Leave request CRUD + approve/reject |
| `Endpoints/LeaveBalanceEndpoints.cs` | Balance queries |
| `Services/LeaveRequestService.cs` | Request business logic |
| `Services/LeaveBalanceService.cs` | Balance calculation |
