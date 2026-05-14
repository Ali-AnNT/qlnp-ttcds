---
day: 4
phase: Leave Slices (Vertical Slice Architecture)
status: pending
effort: 1 day
priority: P0
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - plans/260513-0221-dotnet-migration-refactor/plan.md
---

# Day 4: Leave Slices — LeaveTypes + LeaveRequests + LeaveBalances

## Context

**Depends on:** Day 3 (Employee + Department slices)
**VSA pattern:** Mỗi endpoint là 1 class trong `Features/{Feature}/{Action}/`, REPR (Request-EndPoint-Response-Validator).

## Overview

Implement 3 feature groups theo VSA: LeaveTypes CRUD, LeaveRequests (create/update/approve/reject/cancel), LeaveBalances queries. Business logic trong endpoint handler, không tách Service layer (YAGNI).

## VSA Structure (Day 4)

```
Features/
├── LeaveTypes/
│   ├── List/
│   │   ├── ListLeaveTypesEndpoint.cs    (GET /api/leave-types)
│   │   ├── ListLeaveTypesRequest.cs      (query params: isActive)
│   │   └── ListLeaveTypesResponse.cs     (LeaveTypeDto[])
│   ├── Create/
│   │   ├── CreateLeaveTypeEndpoint.cs   (POST /api/leave-types, [Authorize(QTHT)])
│   │   ├── CreateLeaveTypeRequest.cs    (name, code, defaultDays, description)
│   │   ├── CreateLeaveTypeResponse.cs
│   │   └── CreateLeaveTypeValidator.cs
│   ├── Update/
│   │   ├── UpdateLeaveTypeEndpoint.cs   (PUT /api/leave-types/{id}, [Authorize(QTHT)])
│   │   ├── UpdateLeaveTypeRequest.cs
│   │   ├── UpdateLeaveTypeResponse.cs
│   │   └── UpdateLeaveTypeValidator.cs
│   └── Delete/
│       └── DeleteLeaveTypeEndpoint.cs   (DELETE /api/leave-types/{id}, [Authorize(QTHT)])
├── LeaveRequests/
│   ├── List/
│   │   ├── ListLeaveRequestsEndpoint.cs (GET /api/leave-requests, role-filtered)
│   │   ├── ListLeaveRequestsRequest.cs  (query: status, year, employeeId)
│   │   └── ListLeaveRequestsResponse.cs
│   ├── Create/
│   │   ├── CreateLeaveRequestEndpoint.cs(POST /api/leave-requests)
│   │   ├── CreateLeaveRequestRequest.cs
│   │   ├── CreateLeaveRequestResponse.cs
│   │   └── CreateLeaveRequestValidator.cs
│   ├── Update/
│   │   ├── UpdateLeaveRequestEndpoint.cs(PUT /api/leave-requests/{id}, pending only)
│   │   ├── UpdateLeaveRequestRequest.cs
│   │   ├── UpdateLeaveRequestResponse.cs
│   │   └── UpdateLeaveRequestValidator.cs
│   ├── Approve/
│   │   ├── ApproveLeaveRequestEndpoint.cs(PUT /api/leave-requests/{id}/approve)
│   │   ├── ApproveLeaveRequestRequest.cs
│   │   └── ApproveLeaveRequestValidator.cs
│   ├── Reject/
│   │   ├── RejectLeaveRequestEndpoint.cs(PUT /api/leave-requests/{id}/reject)
│   │   ├── RejectLeaveRequestRequest.cs
│   │   └── RejectLeaveRequestValidator.cs
│   └── Cancel/
│       └── CancelLeaveRequestEndpoint.cs(PUT /api/leave-requests/{id}/cancel)
└── LeaveBalances/
    ├── List/
    │   ├── ListLeaveBalancesEndpoint.cs (GET /api/leave-balances, GD.PGD/QTHT only)
    │   ├── ListLeaveBalancesRequest.cs  (query: year, departmentId)
    │   └── ListLeaveBalancesResponse.cs
    └── My/
        ├── MyLeaveBalanceEndpoint.cs   (GET /api/leave-balances/my)
        └── MyLeaveBalanceResponse.cs
```

## Tasks

### 4.1 LeaveTypes — List + Create + Update + Delete

- [ ] `Features/LeaveTypes/List/ListLeaveTypesRequest.cs` — `record ListLeaveTypesRequest(bool? IsActive)`
- [ ] `Features/LeaveTypes/List/ListLeaveTypesResponse.cs` — `record LeaveTypeDto(Guid Id, string Name, string Code, decimal DefaultDays, string Description, bool IsActive)`
- [ ] `Features/LeaveTypes/List/ListLeaveTypesEndpoint.cs`
  - `Endpoint<ListLeaveTypesRequest, LeaveTypeDto[]>`
  - `Configure()`: `Get("/api/leave-types")`, `[Authorize]`
  - `HandleAsync()`: query `SELECT * FROM leave_types [WHERE is_active = @IsActive]`, return list

- [ ] `Features/LeaveTypes/Create/CreateLeaveTypeRequest.cs` — `record CreateLeaveTypeRequest(string Name, string Code, decimal DefaultDays, string? Description)`
- [ ] `Features/LeaveTypes/Create/CreateLeaveTypeResponse.cs` — `record CreateLeaveTypeResponse(Guid Id)`
- [ ] `Features/LeaveTypes/Create/CreateLeaveTypeValidator.cs`:
  - `Name` — not empty, max 100
  - `Code` — not empty, max 20
  - `DefaultDays` — >= 0
- [ ] `Features/LeaveTypes/Create/CreateLeaveTypeEndpoint.cs`
  - `Endpoint<CreateLeaveTypeRequest, CreateLeaveTypeResponse>`
  - `Configure()`: `Post("/api/leave-types")`, `[Authorize(Roles = "QTHT")]`
  - `HandleAsync()`: INSERT, return new id

- [ ] `Features/LeaveTypes/Update/UpdateLeaveTypeRequest.cs` — `record UpdateLeaveTypeRequest(Guid Id, string Name, string Code, decimal DefaultDays, string? Description, bool IsActive)`
- [ ] `Features/LeaveTypes/Update/UpdateLeaveTypeValidator.cs` — same as Create
- [ ] `Features/LeaveTypes/Update/UpdateLeaveTypeEndpoint.cs`
  - `Configure()`: `Put("/api/leave-types/{id}")`, `[Authorize(Roles = "QTHT")]`
  - `HandleAsync()`: UPDATE by id

- [ ] `Features/LeaveTypes/Delete/DeleteLeaveTypeEndpoint.cs`
  - `Endpoint<EmptyRequest, EmptyResponse>`
  - `Configure()`: `Delete("/api/leave-types/{id}")`, `[Authorize(Roles = "QTHT")]`
  - `HandleAsync()`: kiểm tra không có leave_requests → soft delete (set is_active = 0), 409 nếu có requests

### 4.2 LeaveRequests — List (role-based filtering)

- [ ] `Features/LeaveRequests/List/ListLeaveRequestsRequest.cs` — `record ListLeaveRequestsRequest(string? Status, int? Year, Guid? EmployeeId)`
- [ ] `Features/LeaveRequests/List/ListLeaveRequestsResponse.cs`:
  ```csharp
  public sealed record LeaveRequestDto(
      Guid Id, Guid EmployeeId, string EmployeeName, string DepartmentName,
      Guid LeaveTypeId, string LeaveTypeName,
      DateOnly StartDate, DateOnly EndDate, decimal TotalDays,
      string Reason, string Status,
      string? ApprovedByName, DateTime? ApprovedAt, string? RejectedReason,
      DateTime CreatedAt
  );
  ```
- [ ] `Features/LeaveRequests/List/ListLeaveRequestsEndpoint.cs`
  - `Endpoint<ListLeaveRequestsRequest, LeaveRequestDto[]>`
  - `Configure()`: `Get("/api/leave-requests")`, `[Authorize]`
  - `HandleAsync()`:
    1. Extract `userId`, `role`, `departmentId` từ `HttpContext.Items`
    2. Build SQL WHERE clause dựa trên role + query params:
       - CB.PCM: `employee_id = @UserId`
       - LD.PCM: `e.department_id = @DepartmentId AND e.id != @UserId` (không thấy đơn mình)
       - GD.PGD/QTHT: tất cả
    3. JOIN employees + departments + leave_types
    4. Return DTO array
  - **Không filter ở frontend** — server handles role-based filtering hoàn toàn

### 4.3 LeaveRequests — Create (với business rules)

- [ ] `Features/LeaveRequests/Create/CreateLeaveRequestRequest.cs`:
  ```csharp
  public sealed record CreateLeaveRequestRequest(
      Guid LeaveTypeId, DateOnly StartDate, DateOnly EndDate,
      string Reason, Guid ApprovedById
  );
  ```
- [ ] `Features/LeaveRequests/Create/CreateLeaveRequestValidator.cs`:
  - `LeaveTypeId` — not empty
  - `StartDate` — >= today, <= EndDate
  - `EndDate` — >= StartDate
  - `Reason` — not empty, max 2000
  - `ApprovedById` — not empty
- [ ] `Features/LeaveRequests/Create/CreateLeaveRequestResponse.cs` — `record CreateLeaveRequestResponse(Guid Id)`
- [ ] `Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs`
  - `Endpoint<CreateLeaveRequestRequest, CreateLeaveRequestResponse>`
  - `Configure()`: `Post("/api/leave-requests")`, `[Authorize(Roles = "CB.PCM,LD.PCM")]`
  - `HandleAsync()` (business logic sequence):
    1. **Validate dates**: StartDate <= EndDate, StartDate >= today
    2. **Calculate business days** (Mon-Fri only):
       ```sql
       SELECT COUNT(*) FROM (
         SELECT DATEADD(DAY, number, @StartDate) AS d
         FROM master..spt_values
         WHERE type = 'P' AND number <= DATEDIFF(DAY, @StartDate, @EndDate)
       ) days WHERE DATEPART(WEEKDAY, d) BETWEEN 2 AND 6  -- Mon=2, Fri=6
       ```
       (hoặc tính trong C# bằng loop — data nhỏ)
    3. **Check overlap**: `SELECT COUNT(*) FROM leave_requests WHERE employee_id = @UserId AND status IN ('pending','approved_leader','approved_director') AND start_date <= @EndDate AND end_date >= @StartDate`
    4. Nếu overlap → `ThrowError("Ngày nghỉ trùng với đơn đã tồn tại")` → 409
    5. **Check balance**: query leave_balances cho employee + leave_type + year, check used_days < total_days
    6. **Check approval_config tồn tại** cho leave_type_id
    7. INSERT leave_request với status = 'pending'
    8. Return response

### 4.4 LeaveRequests — Update (pending only)

- [ ] `Features/LeaveRequests/Update/UpdateLeaveRequestRequest.cs` — same fields as Create
- [ ] `Features/LeaveRequests/Update/UpdateLeaveRequestValidator.cs` — same as Create
- [ ] `Features/LeaveRequests/Update/UpdateLeaveRequestEndpoint.cs`
  - `Configure()`: `Put("/api/leave-requests/{id}")`, `[Authorize(Roles = "CB.PCM,LD.PCM")]`
  - `HandleAsync()`:
    1. Kiểm tra request thuộc về user hiện tại
    2. Kiểm tra status = 'pending'
    3. Re-validate dates, re-check overlap (exclude current request)
    4. UPDATE

### 4.5 LeaveRequests — Approve (state machine)

- [ ] `Features/LeaveRequests/Approve/ApproveLeaveRequestRequest.cs` — `record ApproveLeaveRequestRequest(Guid Id)`
- [ ] `Features/LeaveRequests/Approve/ApproveLeaveRequestValidator.cs` — Id not empty
- [ ] `Features/LeaveRequests/Approve/ApproveLeaveRequestEndpoint.cs`
  - `Endpoint<ApproveLeaveRequestRequest, EmptyResponse>`
  - `Configure()`: `Put("/api/leave-requests/{id}/approve")`, `[Authorize(Roles = "LD.PCM,GD.PGD,QTHT")]`
  - `HandleAsync()` (state machine):
    1. Load request: `SELECT * FROM leave_requests WHERE id = @Id`
    2. Kiểm tra không phải đơn của mình
    3. **Nếu approver là LD.PCM** + status = 'pending' → set status = 'approved_leader', approved_by, approved_at
    4. **Nếu approver là GD.PGD/QTHT**:
       - Nếu status = 'pending' (và approval_config chỉ có 1 level hoặc không có LD) → jump thẳng 'approved_director'
       - Nếu status = 'approved_leader' → set 'approved_director', approved_by, approved_at
       - Update leave_balances: `used_days += total_days`
    5. Nếu status không match → `ThrowError("Không thể duyệt đơn ở trạng thái hiện tại")` → 400

### 4.6 LeaveRequests — Reject

- [ ] `Features/LeaveRequests/Reject/RejectLeaveRequestRequest.cs` — `record RejectLeaveRequestRequest(Guid Id, string Reason)`
- [ ] `Features/LeaveRequests/Reject/RejectLeaveRequestValidator.cs` — Reason not empty, max 1000
- [ ] `Features/LeaveRequests/Reject/RejectLeaveRequestEndpoint.cs`
  - `Configure()`: `Put("/api/leave-requests/{id}/reject")`, `[Authorize(Roles = "LD.PCM,GD.PGD,QTHT")]`
  - `HandleAsync()`:
    1. Load request, kiểm tra status đang pending hoặc approved_leader
    2. Set status = 'rejected', rejected_reason, approved_by, approved_at

### 4.7 LeaveRequests — Cancel

- [ ] `Features/LeaveRequests/Cancel/CancelLeaveRequestEndpoint.cs`
  - `Endpoint<EmptyRequest, EmptyResponse>`
  - `Configure()`: `Put("/api/leave-requests/{id}/cancel")`, `[Authorize]`
  - `HandleAsync()`:
    1. Kiểm tra request thuộc về user hoặc user là QTHT
    2. Chỉ cancel được khi status = 'pending' hoặc 'approved_leader'
    3. Set status = 'cancelled'

### 4.8 LeaveBalances — List + My

- [ ] `Features/LeaveBalances/List/ListLeaveBalancesRequest.cs` — `record ListLeaveBalancesRequest(int? Year, Guid? DepartmentId)`
- [ ] `Features/LeaveBalances/List/ListLeaveBalancesResponse.cs`:
  ```csharp
  public sealed record LeaveBalanceDto(
      Guid Id, Guid EmployeeId, string EmployeeName, string DepartmentName,
      Guid LeaveTypeId, string LeaveTypeName,
      int Year, decimal TotalDays, decimal UsedDays, decimal RemainingDays
  );
  ```
- [ ] `Features/LeaveBalances/List/ListLeaveBalancesEndpoint.cs`
  - `Endpoint<ListLeaveBalancesRequest, LeaveBalanceDto[]>`
  - `Configure()`: `Get("/api/leave-balances")`, `[Authorize(Roles = "GD.PGD,QTHT")]`
  - `HandleAsync()`: JOIN employees + departments + leave_types, filter by year/dept

- [ ] `Features/LeaveBalances/My/MyLeaveBalanceResponse.cs` — same as LeaveBalanceDto
- [ ] `Features/LeaveBalances/My/MyLeaveBalanceEndpoint.cs`
  - `Endpoint<EmptyRequest, MyLeaveBalanceResponse[]>`
  - `Configure()`: `Get("/api/leave-balances/my")`, `[Authorize]`
  - `HandleAsync()`: filter by current user

### 4.9 Shared: Business Days Helper

- [ ] `Helpers/BusinessDaysCalculator.cs`:
  ```csharp
  namespace QlnpApi.Helpers;
  
  public static class BusinessDaysCalculator
  {
      public static int Calculate(DateOnly start, DateOnly end)
      {
          // Count Mon-Fri between start and end (inclusive)
          // Used by Create/Update LeaveRequest slices
          int days = 0;
          for (var d = start; d <= end; d = d.AddDays(1))
          {
              if (d.DayOfWeek is >= DayOfWeek.Monday and <= DayOfWeek.Friday)
                  days++;
          }
          return Math.Max(days, 1);
      }
  }
  ```

## Delivery

- [ ] Tạo đơn xin nghỉ → overlap detection → thành công
- [ ] Phê duyệt 2 cấp: pending → LD.PCM approve → approved_leader → GD.PGD approve → approved_director + balance updated
- [ ] GD.PGD approve thẳng pending (khi config 1 level) → approved_director
- [ ] Từ chối đơn → rejected + lưu lý do
- [ ] Hủy đơn pending → cancelled
- [ ] Leave balance hiển thị đúng remaining_days
- [ ] Role-based filtering: CB.PCM chỉ thấy đơn mình, LD.PCM thấy đơn phòng (trừ mình)
- [ ] `dotnet build` không lỗi
- [ ] Test qua curl/Postman

## Files to Create

| Slice | Files |
|-------|-------|
| LeaveTypes/List | `ListLeaveTypesEndpoint.cs`, `ListLeaveTypesRequest.cs`, `ListLeaveTypesResponse.cs` |
| LeaveTypes/Create | `CreateLeaveTypeEndpoint.cs`, `CreateLeaveTypeRequest.cs`, `CreateLeaveTypeResponse.cs`, `CreateLeaveTypeValidator.cs` |
| LeaveTypes/Update | `UpdateLeaveTypeEndpoint.cs`, `UpdateLeaveTypeRequest.cs`, `UpdateLeaveTypeResponse.cs`, `UpdateLeaveTypeValidator.cs` |
| LeaveTypes/Delete | `DeleteLeaveTypeEndpoint.cs` |
| LeaveRequests/List | `ListLeaveRequestsEndpoint.cs`, `ListLeaveRequestsRequest.cs`, `ListLeaveRequestsResponse.cs` |
| LeaveRequests/Create | `CreateLeaveRequestEndpoint.cs`, `CreateLeaveRequestRequest.cs`, `CreateLeaveRequestResponse.cs`, `CreateLeaveRequestValidator.cs` |
| LeaveRequests/Update | `UpdateLeaveRequestEndpoint.cs`, `UpdateLeaveRequestRequest.cs`, `UpdateLeaveRequestResponse.cs`, `UpdateLeaveRequestValidator.cs` |
| LeaveRequests/Approve | `ApproveLeaveRequestEndpoint.cs`, `ApproveLeaveRequestRequest.cs`, `ApproveLeaveRequestValidator.cs` |
| LeaveRequests/Reject | `RejectLeaveRequestEndpoint.cs`, `RejectLeaveRequestRequest.cs`, `RejectLeaveRequestValidator.cs` |
| LeaveRequests/Cancel | `CancelLeaveRequestEndpoint.cs` |
| LeaveBalances/List | `ListLeaveBalancesEndpoint.cs`, `ListLeaveBalancesRequest.cs`, `ListLeaveBalancesResponse.cs` |
| LeaveBalances/My | `MyLeaveBalanceEndpoint.cs`, `MyLeaveBalanceResponse.cs` |
| Helpers | `BusinessDaysCalculator.cs` |

Total: ~33 files

## Related Docs

- `docs/vision/srs.md` — §3: FR-03 (Create), FR-04 (My Leaves), FR-05 (Approval), FR-06 (Calendar data), FR-07 (Summary data)
- `docs/vision/srs.md` — §7.2 State Transitions diagram
- `docs/vision/brd.md` — §5.5 Leave Requests (FR-040 → FR-045), §5.6 Leave Balances (FR-050 → FR-052)
- `docs/vision/brd.md` — §7 Business Rules (BRULE-001 → BRULE-007)
- `docs/code-standards.md` — FastEndpoints conventions
