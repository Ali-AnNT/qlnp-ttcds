---
day: 1
phase: Setup + DB (VSA scaffold)
status: pending
effort: 1 day
priority: P0
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - plans/260513-0221-dotnet-migration-refactor/plan.md
---

# Day 1: .NET 9 FastEndpoints Scaffold + SQL Server Schema + VSA Folder Structure

## Context

**Source:** plan.md → Day 1
**Must align with:** BRD/SRS VSA architecture — scaffold `Features/` (not flat `Endpoints/`), FastEndpoints REPR pattern, Dapper data access.

## Overview

Khởi tạo .NET 9 project với FastEndpoints, VSA folder structure, SQL Server schema 6 bảng, Dapper. Đây là nền tảng cho tất cả các day sau — scaffold đúng VSA ngay từ đầu.

## VSA Folder Structure (Day 1)

```
backend/QlnpApi/
├── Features/                           # (empty in Day 1, populated from Day 2+)
├── Auth/
│   └── JwtService.cs                   # Dual-issuer JWT stub (implemented Day 2)
├── Middleware/
│   └── JwtMiddleware.cs                # Auth middleware stub (implemented Day 2)
├── Data/
│   ├── DbConnectionFactory.cs          # SQL Server IDbConnection factory
│   └── schema.sql                      # Full DDL (6 tables)
├── Program.cs                          # FastEndpoints entry point
├── QlnpApi.csproj                      # .NET 9 project
├── appsettings.json                    # Connection string + JWT config
└── appsettings.Development.json        # Dev overrides
```

**Lưu ý:** `Features/` để trống ở Day 1. Mỗi ngày implement feature sẽ tạo folder slice tương ứng:
- Day 2: `Features/Auth/Login/`, `Features/Auth/Exchange/`, `Features/Auth/Me/`
- Day 3: `Features/Employees/List/`, `Features/Departments/List/`, ...
- Day 4: `Features/LeaveTypes/List/`, `Features/LeaveRequests/Create/`, ...
- Day 5: `Features/Config/Get/`, `Features/Config/Update/`

**Không tạo** `Models/`, `Services/`, `Endpoints/` folders — VSA không cần layer ngang.

## Tasks

### 1.1 Tạo .NET 9 Solution + Project

- [ ] `dotnet new webapi -n QlnpApi --framework net9.0 --use-minimal-apis false`
  - `--use-minimal-apis false` để tránh Minimal API template, dùng FastEndpoints thay thế
- [ ] Xóa template-generated files: `Endpoints/` (nếu có), `Controllers/`, `WeatherForecast*`, `http` files
- [ ] Tạo folder structure:
  ```bash
  mkdir -p Features Auth Middleware Data
  ```
- [ ] Add NuGet packages:
  ```bash
  dotnet add package FastEndpoints
  dotnet add package FastEndpoints.Security        # JWT bearer support
  dotnet add package Dapper
  dotnet add package Microsoft.Data.SqlClient
  dotnet add package BCrypt.Net-Next
  ```
  FastEndpoints bundles FluentValidation, không cần add riêng.

### 1.2 Program.cs — FastEndpoints Entry Point

- [ ] `Program.cs`:
  ```csharp
  using FastEndpoints;
  
  var builder = WebApplication.CreateBuilder(args);
  
  // FastEndpoints
  builder.Services.AddFastEndpoints();
  
  // Auth (configured in Day 2)
  builder.Services.AddAuthentication();
  builder.Services.AddAuthorization();
  
  // Data
  builder.Services.AddSingleton<Data.DbConnectionFactory>();
  
  // JWT (stub, configured in Day 2)
  builder.Services.AddSingleton<Auth.JwtService>();
  
  // CORS for development
  builder.Services.AddCors(options => {
      options.AddPolicy("Dev", policy => 
          policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
  });
  
  var app = builder.Build();
  
  app.UseCors("Dev");
  app.UseAuthentication();
  app.UseAuthorization();
  app.UseFastEndpoints();
  
  app.Run();
  ```

### 1.3 appsettings.json

- [ ] `appsettings.json`:
  ```json
  {
    "ConnectionStrings": {
      "Default": "Server=localhost;Database=QlnpDb;Trusted_Connection=true;TrustServerCertificate=true;"
    },
    "Jwt": {
      "Secret": "your-256-bit-secret-key-here-min-32-chars",
      "Issuer": "app",
      "Audience": "qlnp-app",
      "ExpiryHours": 8,
      "HostIssuer": "host",
      "HostPublicKey": "(RS256 public key PEM — configured when host available)"
    }
  }
  ```
- [ ] `appsettings.Development.json` — local overrides

### 1.4 DbConnectionFactory — Dapper IDbConnection

- [ ] `Data/DbConnectionFactory.cs`:
  ```csharp
  namespace QlnpApi.Data;
  
  public sealed class DbConnectionFactory(IConfiguration config)
  {
      private readonly string _connectionString = config.GetConnectionString("Default") 
          ?? throw new InvalidOperationException("Connection string 'Default' not found.");
  
      public IDbConnection CreateConnection() 
          => new Microsoft.Data.SqlClient.SqlConnection(_connectionString);
  }
  ```

### 1.5 SQL Server Schema (6 bảng)

- [ ] `Data/schema.sql` — full DDL với:
  - **Constraint naming convention:** `PK_<table>`, `FK_<table>_<ref_table>`, `UQ_<table>_<column>`, `CK_<table>_<column>`
  - **departments**: id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID(), name NVARCHAR(200) NOT NULL, code NVARCHAR(20) NOT NULL, created_at DATETIME2 DEFAULT SYSUTCDATETIME()
  - **employees**: id UNIQUEIDENTIFIER PK, username NVARCHAR(50) NOT NULL, password_hash NVARCHAR(255) NOT NULL, full_name NVARCHAR(200) NOT NULL, department_id UNIQUEIDENTIFIER FK → departments, job_title NVARCHAR(100), role NVARCHAR(10) NOT NULL CHECK (role IN ('CB.PCM','LD.PCM','GD.PGD','QTHT')), phone NVARCHAR(20), email NVARCHAR(100), is_active BIT NOT NULL DEFAULT 1, created_at DATETIME2 DEFAULT SYSUTCDATETIME(), updated_at DATETIME2
  - **leave_types**: id UNIQUEIDENTIFIER PK, name NVARCHAR(100) NOT NULL, code NVARCHAR(20) NOT NULL, default_days DECIMAL(5,1) NOT NULL DEFAULT 0, description NVARCHAR(MAX), is_active BIT NOT NULL DEFAULT 1
  - **leave_balances**: id UNIQUEIDENTIFIER PK, employee_id UNIQUEIDENTIFIER FK → employees, leave_type_id UNIQUEIDENTIFIER FK → leave_types, year INT NOT NULL, total_days DECIMAL(5,1) NOT NULL, used_days DECIMAL(5,1) NOT NULL DEFAULT 0, UNIQUE(employee_id, leave_type_id, year)
  - **leave_requests**: id UNIQUEIDENTIFIER PK, employee_id UNIQUEIDENTIFIER FK → employees, leave_type_id UNIQUEIDENTIFIER FK → leave_types, start_date DATE NOT NULL, end_date DATE NOT NULL, total_days DECIMAL(5,1) NOT NULL, reason NVARCHAR(MAX) NOT NULL, status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved_leader','approved_director','rejected','cancelled')), approved_by UNIQUEIDENTIFIER FK → employees, approved_at DATETIME2, rejected_reason NVARCHAR(MAX), created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2
  - **leave_config**: id UNIQUEIDENTIFIER PK, leave_type_id UNIQUEIDENTIFIER FK → leave_types, approval_level INT NOT NULL CHECK (approval_level IN (1,2)), approver_role NVARCHAR(10) NOT NULL CHECK (approver_role IN ('LD.PCM','GD.PGD','QTHT'))

  **Indexes:**
  - employees: IX_employees_username (UNIQUE), IX_employees_department_id
  - leave_requests: IX_leave_requests_employee_id, IX_leave_requests_status, IX_leave_requests_dates (start_date, end_date)
  - leave_balances: UQ_leave_balances_emp_type_year (UNIQUE)
  - leave_config: IX_leave_config_leave_type_id

### 1.6 Seed Data

- [ ] `Data/seed.sql` — dữ liệu tối thiểu để test:
  - 3 departments: Phòng Chuyên môn, Phòng Hành chính, Ban Giám đốc
  - 4 employees (1 mỗi role): 
    - CB.PCM: `nhanvien` / `123456`
    - LD.PCM: `truongphong` / `123456`
    - GD.PGD: `giamdoc` / `123456`
    - QTHT: `admin` / `123456`
  - 3 leave types: Nghỉ phép năm (code: ANNUAL, 12 ngày), Nghỉ ốm (SICK, 5 ngày), Nghỉ việc riêng (PERSONAL, 3 ngày)
  - 2 approval configs: ANNUAL → level 1 (LD.PCM) + level 2 (GD.PGD); SICK → level 1 (LD.PCM)
  - Leave balances cho mỗi employee năm 2026
  - 2-3 leave requests mẫu (1 pending, 1 approved)

  **Password hash:** BCrypt hash của "123456" (generate bằng `BCrypt.Net.BCrypt.HashPassword("123456", workFactor: 12)`)

## Delivery

- [ ] `dotnet build` thành công
- [ ] SQL schema chạy được trên SQL Server (local Docker hoặc instance)
- [ ] Seed data chạy xong, login được với `admin/123456`
- [ ] Cấu trúc `Features/`, `Auth/`, `Middleware/`, `Data/` folders sẵn sàng

## Files to Create

| File | Purpose |
|------|---------|
| `QlnpApi.csproj` | .NET 9 + FastEndpoints packages |
| `Program.cs` | FastEndpoints entry |
| `appsettings.json` | Connection string + JWT config |
| `appsettings.Development.json` | Dev overrides |
| `Data/DbConnectionFactory.cs` | Dapper IDbConnection |
| `Data/schema.sql` | Full DDL (6 tables + indexes) |
| `Data/seed.sql` | Seed data (4 users, 3 leave types, etc.) |

## Related Docs

- `docs/vision/brd.md` — Appendix A: Database Migration Mapping (PostgreSQL → SQL Server types)
- `docs/vision/srs.md` — §4.2 Database Tables column definitions
- `docs/code-standards.md` — C# coding conventions
