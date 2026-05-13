---
day: 8
phase: Page Refactor P2
status: pending
effort: 1 day
priority: P1
---

# Day 8: Page Refactor (Part 2)

## Context

**Depends on:** Day 7 (page P1 done)

## Overview

Refactor các trang còn lại: Approval, Summary, Reports, Violations, Config.

## Tasks

### 8.1 ApprovalPage

- [ ] `src/pages/ApprovalPage.tsx`
  - Load requests phù hợp với role (server filters)
  - LD.PCM: hiển thị request cấp phòng (status=pending)
  - GD.PGD: hiển thị request đã qua LD + pending direct
  - Approve button → `leaveRequestApi.approve(id)`
  - Reject button → dialog nhập reason → `leaveRequestApi.reject(id, reason)`
  - Hiển thị employee name + department name (join từ store cache)
  - Timeline hiển thị approval history

### 8.2 SummaryPage

- [ ] `src/pages/SummaryPage.tsx`
  - Thống kê theo phòng ban, loại phép, tháng
  - Dùng `useStore().leaveRequests` đã filter
  - Charts dùng Recharts (giữ nguyên)
  - Export button (có thể để P2)

### 8.3 ReportsPage

- [ ] `src/pages/ReportsPage.tsx`
  - Báo cáo chi tiết: filter theo khoảng thời gian, phòng ban, loại phép
  - Table hiển thị danh sách request
  - Summary stats: tổng ngày nghỉ, số đơn, etc.
  - Download CSV/Excel (có thể delay)

### 8.4 ViolationsPage

- [ ] `src/pages/ViolationsPage.tsx`
  - Phát hiện vi phạm: nghỉ quá số ngày, không báo trước
  - Rules từ config API
  - Danh sách employees vi phạm + chi tiết
  - Filter theo tháng/năm

### 8.5 ConfigPage

- [ ] `src/pages/ConfigPage.tsx`
  - Quản lý approval workflows
  - Add/edit/remove approval levels cho từng loại phép
  - Quy định chung: max days, min notice days
  - Gọi `configApi.getAll()` / `configApi.update()`

### 8.6 AppLayout + Sidebar

- [ ] `src/pages/AppLayout.tsx` — dùng `useAuth()` thay vì `useStore()`
- [ ] `src/components/AppSidebar.tsx` — role-based menu visibility từ `useAuth().user.role`
- [ ] `src/components/AppHeader.tsx` — hiển thị user info từ `useAuth().user`

## Delivery

- [ ] Approval flow end-to-end: pending → approved_leader → approved_director
- [ ] Config thay đổi phản ánh trong approval flow
- [ ] Reports + Violations data chính xác

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ApprovalPage.tsx` | Approve/reject flow |
| `src/pages/SummaryPage.tsx` | Stats from API |
| `src/pages/ReportsPage.tsx` | Reports from API |
| `src/pages/ViolationsPage.tsx` | Violations from API |
| `src/pages/ConfigPage.tsx` | Config CRUD |
| `src/pages/AppLayout.tsx` | useAuth |
| `src/components/AppSidebar.tsx` | Role from auth |
| `src/components/AppHeader.tsx` | User from auth |
