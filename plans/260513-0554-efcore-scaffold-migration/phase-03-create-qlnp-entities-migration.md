---
phase: 3
title: "Create QLNP Entities & Migration"
status: completed
priority: P0
effort: "2h"
dependencies: ["2"]
---

# Phase 3: Create QLNP Entities & Migration

## Overview

Tạo 5 entity Code First, cấu hình relationships, InitialCreate migration, apply DB.

## Architecture

```
Entities/
├── UserMaster.cs         (scaffold, excluded from migration)
├── DmDonvi.cs            (scaffold, excluded from migration)
├── UserRole.cs           (Code First)
├── LeaveType.cs          (Code First)
├── LeaveBalance.cs       (Code First)
├── LeaveRequest.cs       (Code First)
└── LeaveConfig.cs        (Code First)
```

## Related Code Files

| Action | File |
|--------|------|
| Create | `packages/api/Entities/UserRole.cs` |
| Create | `packages/api/Entities/LeaveType.cs` |
| Create | `packages/api/Entities/LeaveBalance.cs` |
| Create | `packages/api/Entities/LeaveRequest.cs` |
| Create | `packages/api/Entities/LeaveConfig.cs` |
| Modify | `packages/api/Data/AppDbContext.cs` |
| Create | `packages/api/Data/Migrations/InitialCreate.cs` |

## Entity Schemas

- **UserRole**: UserId (bigint PK), Role (nvarchar 10), FK→UserMaster
- **LeaveType**: Id (bigint PK IDENTITY), Name (nvarchar 100), Code (nvarchar 20 UNIQUE), DefaultDays (decimal 5,1), Description (nvarchar max), IsActive (bit)
- **LeaveBalance**: Id (bigint PK IDENTITY), UserId FK→UserMaster, LeaveTypeId FK→LeaveType, Year (int), TotalDays (decimal 5,1), UsedDays (decimal 5,1), UNIQUE(UserId, LeaveTypeId, Year)
- **LeaveRequest**: Id (bigint PK IDENTITY), UserId FK→UserMaster, LeaveTypeId FK→LeaveType, StartDate (date), EndDate (date), TotalDays (decimal 5,1), Reason (nvarchar max), Status (nvarchar 20), ApprovedBy FK→UserMaster nullable, ApprovedAt (datetime2 nullable), RejectedReason (nvarchar max), CreatedAt (datetime2, default SYSUTCDATETIME()), UpdatedAt (datetime2 nullable)
- **LeaveConfig**: Id (bigint PK IDENTITY), LeaveTypeId FK→LeaveType, ApprovalLevel (int CHECK>=1), ApproverRole (nvarchar 10)

## Implementation Steps

1. Tạo 5 entity class files trong `Entities/`
2. Thêm 5 DbSet vào AppDbContext
3. Cấu hình OnModelCreating: FK relationships, indexes, constraints, decimal precision, default values
4. Seed data: 3 leave_types (Nghỉ phép năm, Ốm đau, Việc riêng) + 1 user_role (quantri → QTHT)
5. `dotnet ef migrations add InitialCreate --output-dir Data/Migrations`
6. Verify migration chỉ chứa 5 bảng QLNP
7. `dotnet ef database update`
8. Verify trên SQL Server: 5 bảng + seed data

## Success Criteria

- [ ] 5 entity files compile
- [ ] AppDbContext có 7 DbSet (2 system + 5 QLNP)
- [ ] InitialCreate migration chỉ chứa 5 bảng mới
- [ ] `dotnet ef database update` thành công
- [ ] SQL Server có 5 bảng QLNP + seed data
