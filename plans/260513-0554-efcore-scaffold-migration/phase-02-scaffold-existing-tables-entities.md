---
phase: 2
title: "Scaffold Existing Tables & Entities"
status: pending
priority: P0
effort: "1h"
dependencies: ["1"]
---

# Phase 2: Scaffold Existing Tables & Entities

## Context

**DB:** SQL Server 2016 @ 192.168.1.13:1439, database VI_NGHIPHEP
**Tables:** USER_MASTER (9 cột), DM_DONVI (22 cột)

## Overview

Dùng `dotnet ef dbcontext scaffold` để generate entity classes + DbContext từ 2 bảng có sẵn.

## Related Code Files

| Action | File |
|--------|------|
| Create | `packages/api/Entities/UserMaster.cs` |
| Create | `packages/api/Entities/DmDonvi.cs` |
| Create | `packages/api/Data/AppDbContext.cs` |

## Implementation Steps

1. Install dotnet-ef tool:
   ```bash
   dotnet tool install --global dotnet-ef --version 9.0.0
   ```
2. Chạy scaffold command:
   ```bash
   dotnet ef dbcontext scaffold \
     "Server=192.168.1.13,1439;Database=VI_NGHIPHEP;User Id=vietinfo;Password=Vietinfo@#@!;TrustServerCertificate=True" \
     Microsoft.EntityFrameworkCore.SqlServer \
     --table USER_MASTER \
     --table DM_DONVI \
     --output-dir Entities \
     --context-dir Data \
     --context AppDbContext \
     --force \
     --no-pluralize
   ```
3. Exclude system tables from EF migrations:
   ```csharp
   modelBuilder.Entity<UserMaster>().ToTable(t => t.ExcludeFromMigrations());
   modelBuilder.Entity<DmDonvi>().ToTable(t => t.ExcludeFromMigrations());
   ```
4. `dotnet build` — verify compile

## Key Notes

- `--no-pluralize`: giữ tên bảng gốc
- `--force`: overwrite nếu đã tồn tại
- Partial classes → có thể mở rộng sau

## Success Criteria

- [ ] Entities/UserMaster.cs có 9 property khớp USER_MASTER columns
- [ ] Entities/DmDonvi.cs có 22 property khớp DM_DONVI columns
- [ ] Data/AppDbContext.cs có DbSet<UserMaster> + DbSet<DmDonvi>
- [ ] ExcludeFromMigrations() cho 2 bảng system
- [ ] `dotnet build` success
