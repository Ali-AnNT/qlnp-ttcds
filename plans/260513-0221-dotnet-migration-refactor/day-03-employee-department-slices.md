---
day: 3
phase: Employee + Department Slices
status: pending
effort: 1 day
priority: P0
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - plans/260513-0221-dotnet-migration-refactor/plan.md
---

# Day 3: Employee + Department Slices (VSA)

## Context

**Depends on:** Day 2 (auth middleware + JWT available for authorization)
**VSA pattern:** Mỗi endpoint 1 class trong `Features/Employees/{Action}/` và `Features/Departments/{Action}/`

## Overview

CRUD endpoints cho Employees và Departments theo VSA. Role-based authorization: QTHT mới được ghi, tất cả role authenticated được đọc.

## VSA Structure (Day 3)

```
Features/
├── Employees/
│   ├── List/
│   │   ├── ListEmployeesEndpoint.cs     (GET /api/employees, filter: departmentId)
│   │   ├── ListEmployeesRequest.cs      (query: departmentId?)
│   │   └── ListEmployeesResponse.cs     (EmployeeDto[])
│   ├── GetById/
│   │   ├── GetEmployeeEndpoint.cs       (GET /api/employees/{id})
│   │   └── GetEmployeeResponse.cs
│   ├── Create/
│   │   ├── CreateEmployeeEndpoint.cs    (POST /api/employees, [Authorize(QTHT)])
│   │   ├── CreateEmployeeRequest.cs
│   │   ├── CreateEmployeeResponse.cs
│   │   └── CreateEmployeeValidator.cs
│   ├── Update/
│   │   ├── UpdateEmployeeEndpoint.cs    (PUT /api/employees/{id}, [Authorize(QTHT)])
│   │   ├── UpdateEmployeeRequest.cs
│   │   ├── UpdateEmployeeResponse.cs
│   │   └── UpdateEmployeeValidator.cs
│   └── Delete/
│       └── DeleteEmployeeEndpoint.cs    (DELETE /api/employees/{id}, [Authorize(QTHT)], soft delete)
└── Departments/
    ├── List/
    │   ├── ListDepartmentsEndpoint.cs   (GET /api/departments)
    │   └── ListDepartmentsResponse.cs
    ├── GetById/
    │   └── GetDepartmentEndpoint.cs     (GET /api/departments/{id})
    ├── Create/
    │   ├── CreateDepartmentEndpoint.cs  (POST /api/departments, [Authorize(QTHT)])
    │   ├── CreateDepartmentRequest.cs
    │   ├── CreateDepartmentResponse.cs
    │   └── CreateDepartmentValidator.cs
    ├── Update/
    │   ├── UpdateDepartmentEndpoint.cs  (PUT /api/departments/{id}, [Authorize(QTHT)])
    │   ├── UpdateDepartmentRequest.cs
    │   ├── UpdateDepartmentResponse.cs
    │   └── UpdateDepartmentValidator.cs
    └── Delete/
        └── DeleteDepartmentEndpoint.cs  (DELETE /api/departments/{id}, [Authorize(QTHT)], check FK)
```

## Tasks

### 3.1 Employee Slices

- [ ] `Features/Employees/List/ListEmployeesRequest.cs` — `record ListEmployeesRequest(Guid? DepartmentId)`
- [ ] `Features/Employees/List/ListEmployeesResponse.cs`:
  ```csharp
  public sealed record EmployeeDto(
      Guid Id, string Username, string FullName, string? JobTitle,
      string Role, string? Phone, string? Email,
      Guid DepartmentId, string DepartmentName,
      bool IsActive, DateTime CreatedAt
  );
  // Không bao gồm password_hash trong response
  ```
- [ ] `Features/Employees/List/ListEmployeesEndpoint.cs`
  - `Endpoint<ListEmployeesRequest, EmployeeDto[]>`
  - `Configure()`: `Get("/api/employees")`, `[Authorize]`
  - `HandleAsync()`: `SELECT e.*, d.name AS DepartmentName FROM employees e JOIN departments d ON e.department_id = d.id [WHERE e.department_id = @DepartmentId]`

- [ ] `Features/Employees/GetById/GetEmployeeResponse.cs` — same as EmployeeDto
- [ ] `Features/Employees/GetById/GetEmployeeEndpoint.cs`
  - `Endpoint<EmptyRequest, GetEmployeeResponse>`
  - `Configure()`: `Get("/api/employees/{id}")`, `[Authorize]`
  - `HandleAsync()`: query by id, 404 nếu không tìm thấy

- [ ] `Features/Employees/Create/CreateEmployeeRequest.cs`:
  ```csharp
  public sealed record CreateEmployeeRequest(
      string Username, string Password, string FullName,
      Guid DepartmentId, string? JobTitle, string Role,
      string? Phone, string? Email
  );
  ```
- [ ] `Features/Employees/Create/CreateEmployeeValidator.cs`:
  - `Username` — not empty, max 50, unique (check trong handler)
  - `Password` — not empty, min 6
  - `FullName` — not empty, max 200
  - `Role` — must be one of: CB.PCM, LD.PCM, GD.PGD, QTHT
- [ ] `Features/Employees/Create/CreateEmployeeResponse.cs` — `record CreateEmployeeResponse(Guid Id)`
- [ ] `Features/Employees/Create/CreateEmployeeEndpoint.cs`
  - `Endpoint<CreateEmployeeRequest, CreateEmployeeResponse>`
  - `Configure()`: `Post("/api/employees")`, `[Authorize(Roles = "QTHT")]`
  - `HandleAsync()`: BCrypt hash password, INSERT employee, return id

- [ ] `Features/Employees/Update/UpdateEmployeeRequest.cs` — same as Create but không password (có field riêng cho reset password)
- [ ] `Features/Employees/Update/UpdateEmployeeValidator.cs`
- [ ] `Features/Employees/Update/UpdateEmployeeEndpoint.cs`
  - `Configure()`: `Put("/api/employees/{id}")`, `[Authorize(Roles = "QTHT")]`
  - `HandleAsync()`: UPDATE by id

- [ ] `Features/Employees/Delete/DeleteEmployeeEndpoint.cs`
  - `Configure()`: `Delete("/api/employees/{id}")`, `[Authorize(Roles = "QTHT")]`
  - `HandleAsync()`: set is_active = 0 (soft delete). Kiểm tra không có leave_requests active → 409 nếu có

### 3.2 Department Slices

- [ ] `Features/Departments/List/ListDepartmentsResponse.cs` — `record DepartmentDto(Guid Id, string Name, string Code)`
- [ ] `Features/Departments/List/ListDepartmentsEndpoint.cs`
  - `Endpoint<EmptyRequest, DepartmentDto[]>`
  - `Configure()`: `Get("/api/departments")`, `[Authorize]`

- [ ] `Features/Departments/GetById/GetDepartmentEndpoint.cs`
  - `Configure()`: `Get("/api/departments/{id}")`, `[Authorize]`

- [ ] `Features/Departments/Create/CreateDepartmentRequest.cs` — `record CreateDepartmentRequest(string Name, string Code)`
- [ ] `Features/Departments/Create/CreateDepartmentValidator.cs` — `Name` not empty, `Code` not empty
- [ ] `Features/Departments/Create/CreateDepartmentEndpoint.cs`
  - `Configure()`: `Post("/api/departments")`, `[Authorize(Roles = "QTHT")]`

- [ ] `Features/Departments/Update/UpdateDepartmentRequest.cs`
- [ ] `Features/Departments/Update/UpdateDepartmentEndpoint.cs`
  - `Configure()`: `Put("/api/departments/{id}")`, `[Authorize(Roles = "QTHT")]`

- [ ] `Features/Departments/Delete/DeleteDepartmentEndpoint.cs`
  - `Configure()`: `Delete("/api/departments/{id}")`, `[Authorize(Roles = "QTHT")]`
  - `HandleAsync()`: kiểm tra không có employees FK → 409 nếu có

## Delivery

- [ ] List employees với filter department → đúng data
- [ ] CRUD employee (QTHT) → thành công
- [ ] Non-QTHT gọi POST/PUT/DELETE employee → 403
- [ ] CRUD department (QTHT) → thành công
- [ ] Delete department có employees → 409
- [ ] `dotnet build` không lỗi
- [ ] Test qua curl/Postman

## Files to Create

| Slice | Files |
|-------|-------|
| Employees/List | `ListEmployeesEndpoint.cs`, `ListEmployeesRequest.cs`, `ListEmployeesResponse.cs` |
| Employees/GetById | `GetEmployeeEndpoint.cs`, `GetEmployeeResponse.cs` |
| Employees/Create | `CreateEmployeeEndpoint.cs`, `CreateEmployeeRequest.cs`, `CreateEmployeeResponse.cs`, `CreateEmployeeValidator.cs` |
| Employees/Update | `UpdateEmployeeEndpoint.cs`, `UpdateEmployeeRequest.cs`, `UpdateEmployeeResponse.cs`, `UpdateEmployeeValidator.cs` |
| Employees/Delete | `DeleteEmployeeEndpoint.cs` |
| Departments/List | `ListDepartmentsEndpoint.cs`, `ListDepartmentsResponse.cs` |
| Departments/GetById | `GetDepartmentEndpoint.cs` |
| Departments/Create | `CreateDepartmentEndpoint.cs`, `CreateDepartmentRequest.cs`, `CreateDepartmentResponse.cs`, `CreateDepartmentValidator.cs` |
| Departments/Update | `UpdateDepartmentEndpoint.cs`, `UpdateDepartmentRequest.cs`, `UpdateDepartmentResponse.cs`, `UpdateDepartmentValidator.cs` |
| Departments/Delete | `DeleteDepartmentEndpoint.cs` |

Total: ~22 files

## Related Docs

- `docs/vision/srs.md` — §3: FR-10 (Employee data), role matrix
- `docs/vision/brd.md` — §5.2-5.3 Employee + Department management
- `docs/code-standards.md` — FastEndpoints conventions, C# patterns
