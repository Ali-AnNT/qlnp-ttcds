---
day: 8
phase: Page Refactor P1
status: pending
effort: 1 day
priority: P1
---

# Day 8: Page Refactor (Part 1)

## Context

**Depends on:** Day 6 (store + auth sẵn sàng)

## Overview

Refactor các trang sử dụng state mới: Dashboard, Login, LeaveNew, LeaveMy, Calendar.

## Tasks

### 7.1 LoginPage

- [ ] `src/pages/LoginPage.tsx`
  - Gọi `useAuth().login()` thay vì `useStore().login()`
  - Hiển thị lỗi từ API response
  - Redirect sau login thành công
  - Embed mode: thêm postMessage báo host sau login

### 7.2 DashboardPage

- [ ] `src/pages/DashboardPage.tsx`
  - Dùng `useStore().leaveRequests` → đã load qua `loadData()`
  - Dùng `useStore().leaveBalances` nếu có, hoặc gọi API riêng
  - Giữ nguyên UI cards, charts
  - Data từ `Employee` type → hiển thị đúng field names

### 7.3 LeaveNewPage

- [ ] `src/pages/LeaveNewPage.tsx`
  - Form submit gọi `useStore().addLeaveRequest()`
  - Load leave_types từ `useStore().leaveTypes`
  - Validate balance trước khi submit (gọi `balanceApi.getMy()`)
  - Date picker: validate không overlap với request hiện có
  - Toast notification khi tạo thành công

### 7.4 LeaveMyPage

- [ ] `src/pages/LeaveMyPage.tsx`
  - Filter `useStore().leaveRequests` theo current user
  - Status labels từ `leaveStatusLabels`
  - Cancel button gọi `useStore().updateLeaveRequest(id, { status: 'cancelled' })`
  - Color-coded status badges

### 7.5 CalendarPage

- [ ] `src/pages/CalendarPage.tsx`
  - Dùng `useStore().leaveRequests` + `useStore().employees`
  - Map requests → calendar events
  - Filter theo department nếu LD.PCM/GD.PGD
  - Color code theo leave_type hoặc status

## Delivery

- [ ] 5 pages hoạt động với API backend thật
- [ ] Login/logout flow end-to-end
- [ ] Form tạo đơn → hiển thị trong My Leaves

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/LoginPage.tsx` | useAuth, API errors |
| `src/pages/DashboardPage.tsx` | Data from store |
| `src/pages/LeaveNewPage.tsx` | API form submit |
| `src/pages/LeaveMyPage.tsx` | API data source |
| `src/pages/CalendarPage.tsx` | Request mapping |
