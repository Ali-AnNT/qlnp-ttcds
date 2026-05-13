---
phase: 1
title: "Scaffold Project & EF Core Setup"
status: completed
priority: P0
effort: "1h"
dependencies: []
---

# Phase 1: Scaffold Project & EF Core Setup

## Context

**Source:** `plans/reports/brainstorm-260513-0543-existing-system-schema-design.md`

## Overview

Khởi tạo .NET 9 project, cài NuGet packages, cấu trúc thư mục VSA.

## Related Code Files

| Action | File |
|--------|------|
| Create | `packages/api/QLNP.Api.csproj` |
| Create | `packages/api/Program.cs` |
| Create | `packages/api/appsettings.json` |
| Create | `packages/api/appsettings.Development.json` |
| Delete | `packages/api/.gitkeep` |

## Implementation Steps

1. Cài .NET 9 SDK (đã xong — `$HOME/.dotnet`, version 9.0.314)
2. `rm packages/api/.gitkeep && dotnet new webapi -n QLNP.Api -o packages/api --framework net9.0 --no-https`
3. Tạo cấu trúc thư mục:
   ```
   packages/api/
   ├── Entities/
   ├── Data/Migrations/
   ├── Features/
   │   ├── Auth/Me/
   │   ├── LeaveTypes/{List,Create,Update,Delete}/
   │   ├── LeaveRequests/{List,Create,Update,Approve,Reject,Cancel}/
   │   ├── LeaveBalances/{List,My}/
   │   └── Config/{Get,Update,UserRole}/
   └── Middleware/
   ```
4. Add NuGet packages (PIN version 9.0.x cho EF Core):
   ```bash
   dotnet add package FastEndpoints
   dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 9.0.0
   dotnet add package Microsoft.EntityFrameworkCore.Design --version 9.0.0
   dotnet add package Microsoft.EntityFrameworkCore.Tools --version 9.0.0
   ```
5. Cấu hình `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=192.168.1.13,1439;Database=VI_NGHIPHEP;User Id=vietinfo;Password=Vietinfo@#@!;TrustServerCertificate=True"
     },
     "GatewayHeaders": {
       "UserId": "X-User-Id",
       "UserName": "X-User-Name",
       "UserFullName": "X-User-FullName"
     }
   }
   ```
6. Xóa weather forecast boilerplate trong Program.cs
7. `dotnet build` — verify không lỗi

## Success Criteria

- [ ] `dotnet build` success với .NET 9
- [ ] 4 NuGet packages trong csproj (FastEndpoints + EF Core x3)
- [ ] EF Core version = 9.0.x (không phải 10.x)
- [ ] Thư mục Features/, Entities/, Data/, Middleware/ tồn tại
- [ ] appsettings.json có connection string + GatewayHeaders config
