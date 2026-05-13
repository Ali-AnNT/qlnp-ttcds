---
day: 5
phase: Frontend API Layer
status: pending
effort: 1 day
priority: P1
---

# Day 5: Frontend API Client Layer

## Context

**Depends on:** Day 4 (backend APIs hoàn thiện)

## Overview

Tạo tầng API client trong frontend thay thế Supabase calls. 8 files + fetch wrapper với JWT intercept.

## Tasks

### 5.1 Fetch Wrapper

- [ ] `src/api/client.ts`
  - `API_BASE` từ env `VITE_API_URL`
  - `setAuthToken(token)` / `getAuthToken()` — lưu vào localStorage
  - `request<T>(method, path, body?)` — fetch wrapper:
    - Tự động attach `Authorization: Bearer <token>` (standalone) hoặc không cần (embed — gateway forwards)
    - Xử lý 401 → throw AuthError
    - Parse JSON response
    - Type-safe generics
  - Export: `get<T>(path)`, `post<T>(path, body)`, `put<T>(path, body)`, `del(path)`

### 5.2 API Module Files

- [ ] `src/api/auth-api.ts`
  - `login(username, password): Promise<{token, user}>`
  - `getMe(): Promise<AuthUser>`
  - **Note:** No exchangeToken — Gateway handles host auth

- [ ] `src/api/employee-api.ts`
  - `getAll(): Promise<Employee[]>`
  - `getById(id): Promise<Employee>`
  - `create(data): Promise<Employee>`
  - `update(id, data): Promise<Employee>`
  - `remove(id): Promise<void>`

- [ ] `src/api/department-api.ts`
  - `getAll(): Promise<Department[]>`
  - `getById(id): Promise<Department>`
  - `create(data): Promise<Department>`
  - `update(id, data): Promise<Department>`
  - `remove(id): Promise<void>`

- [ ] `src/api/leave-type-api.ts`
  - `getAll(): Promise<LeaveType[]>`
  - `create(data): Promise<LeaveType>`
  - `update(id, data): Promise<LeaveType>`
  - `remove(id): Promise<void>`

- [ ] `src/api/leave-request-api.ts`
  - `getAll(params?): Promise<LeaveRequest[]>`
  - `getById(id): Promise<LeaveRequest>`
  - `create(data): Promise<LeaveRequest>`
  - `update(id, data): Promise<LeaveRequest>`
  - `approve(id): Promise<LeaveRequest>`
  - `reject(id, reason): Promise<LeaveRequest>`
  - `cancel(id): Promise<LeaveRequest>`
  - `remove(id): Promise<void>`

- [ ] `src/api/leave-balance-api.ts`
  - `getAll(params?): Promise<LeaveBalance[]>`
  - `getMy(): Promise<LeaveBalance[]>`
  - `getByEmployee(employeeId): Promise<LeaveBalance[]>`

- [ ] `src/api/config-api.ts`
  - `getAll(): Promise<ApprovalConfig[]>`
  - `update(id, data): Promise<ApprovalConfig>`

### 5.3 Type Alignment

- [ ] Kiểm tra types trong `src/lib/leave-data.ts` khớp với API response
- [ ] Thêm type `ApiError` và `AuthUser` vào leave-data.ts
- [ ] Xóa field `password` khỏi Employee type (ko bao giờ trả về từ API)

## Delivery

- [ ] Gọi `authApi.login()` thành công với backend
- [ ] Token lưu vào localStorage, request sau tự động attach
- [ ] 401 response throw error đúng

## Files to Create

| File | Purpose |
|------|---------|
| `src/api/client.ts` | Fetch wrapper |
| `src/api/auth-api.ts` | Auth endpoints |
| `src/api/employee-api.ts` | Employee endpoints |
| `src/api/department-api.ts` | Department endpoints |
| `src/api/leave-type-api.ts` | Leave type endpoints |
| `src/api/leave-request-api.ts` | Leave request endpoints |
| `src/api/leave-balance-api.ts` | Balance endpoints |
| `src/api/config-api.ts` | Config endpoints |
