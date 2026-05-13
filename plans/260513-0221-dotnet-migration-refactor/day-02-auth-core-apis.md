---
day: 2
phase: Auth + Core APIs
status: pending
effort: 1 day
priority: P0
---

# Day 2: JWT Auth + Employee/Department APIs

## Context

**Depends on:** Day 1 (schema + scaffold)
**Decision:** Gateway handles host auth → BE only internal JWT, no dual-issuer

## Overview

Implement JWT auth (login nội bộ), Employee CRUD, Department CRUD. Gateway đã check auth khi embed nên BE chỉ cần 1 loại JWT.

## Tasks

### 2.1 JWT Auth Service

- [ ] `Services/AuthService.cs`
  - `Login(username, password)` — verify BCrypt hash, trả về JWT
  - `GetCurrentUser(employeeId)` — trả về thông tin user
- [ ] `Services/JwtService.cs`
  - `GenerateToken(employee)` — tạo JWT với claims: sub, role, username, fullName, deptId
  - `ValidateToken(token)` — validate + return ClaimsPrincipal
  - Symmetric key từ appsettings `Jwt:Secret`

### 2.2 Auth Middleware

- [ ] `Middleware/JwtMiddleware.cs`
  - Extract Bearer token từ Authorization header
  - Validate token → set `HttpContext.Items["UserId"]`, `HttpContext.Items["UserRole"]`
  - 401 nếu token không hợp lệ
  - **Embed mode:** Gateway gửi user info qua header (`X-User-Id`, `X-User-Role`) → không cần token

### 2.3 Auth Endpoints

- [ ] `Endpoints/AuthEndpoints.cs`
  - `POST /api/auth/login` — { username, password } → { token, user }
  - `GET /api/auth/me` — trả về current user từ JWT hoặc header (embed)

### 2.4 Employee Endpoints

- [ ] `Endpoints/EmployeeEndpoints.cs`
  - `GET /api/employees` — list all (filter: department_id query param)
  - `GET /api/employees/{id}` — single employee
  - `POST /api/employees` — create (QTHT only)
  - `PUT /api/employees/{id}` — update (QTHT only)
  - `DELETE /api/employees/{id}` — soft delete set is_active=0 (QTHT only)

### 2.5 Department Endpoints

- [ ] `Endpoints/DepartmentEndpoints.cs`
  - `GET /api/departments` — list all
  - `GET /api/departments/{id}` — single
  - `POST /api/departments` — create (QTHT only)
  - `PUT /api/departments/{id}` — update (QTHT only)
  - `DELETE /api/departments/{id}` — delete (QTHT only, check no employees)

### 2.6 Role-based Authorization

- [ ] `Middleware/RoleRequirement.cs` — attribute-based role check
- [ ] Apply cho POST/PUT/DELETE endpoints: QTHT hoặc GD.PGD

### 2.7 IIS Hosting Config

- [ ] `backend/QlnpApi/web.config` — IIS out-of-process/in-process hosting
- [ ] `Program.cs` — configure `builder.WebHost.UseIIS()`
- [ ] ASP.NET Core IIS module config

## Delivery

- [ ] Login với seed user trả về JWT hợp lệ
- [ ] CRUD Employee/Department qua curl/Postman
- [ ] 401 khi không có token (standalone), nhận user từ header khi embed
- [ ] `dotnet build` + publish to IIS folder

## Files to Create

| File | Purpose |
|------|---------|
| `Services/AuthService.cs` | Login, getMe |
| `Services/JwtService.cs` | Token generate/validate (single issuer) |
| `Middleware/JwtMiddleware.cs` | Auth: JWT hoặc X-User-* headers |
| `Middleware/RoleRequirement.cs` | Role check |
| `Endpoints/AuthEndpoints.cs` | Auth routes (login + me) |
| `Endpoints/EmployeeEndpoints.cs` | Employee CRUD |
| `Endpoints/DepartmentEndpoints.cs` | Department CRUD |
| `web.config` | IIS hosting config |
