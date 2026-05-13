---
day: 1
phase: Setup + DB
status: pending
effort: 1 day
priority: P0
---

# Day 1: .NET Scaffold + SQL Server Schema

## Context

**Source:** brainstorm-260512-0906-standalone-dotnet-migration.md
**Branch:** rebuid-bundle

## Overview

Khởi tạo .NET 9 project với Minimal API, thiết kế SQL Server schema 6 bảng, cấu hình Dapper.

## Tasks

### 1.1 Tạo .NET 9 Solution + Project

- [ ] `dotnet new webapi -n QlnpApi --framework net9.0`
- [ ] Cấu trúc thư mục: `Models/`, `Services/`, `Data/`, `Middleware/`, `Endpoints/`
- [ ] Add NuGet packages: Dapper, Microsoft.Data.SqlClient, BCrypt.Net-Next, System.IdentityModel.Tokens.Jwt
- [ ] Cấu hình `appsettings.json`: connection string, JWT settings (own issuer + host issuer)

### 1.2 SQL Server Schema (6 bảng)

- [ ] `departments` — id UNIQUEIDENTIFIER PK DEFAULT NEWSEQUENTIALID(), name NVARCHAR(200), code NVARCHAR(20)
- [ ] `employees` — id UNIQUEIDENTIFIER PK, username NVARCHAR(50) UNIQUE, password_hash NVARCHAR(255), full_name NVARCHAR(200), department_id FK, job_title NVARCHAR(100), role NVARCHAR(10) CHECK, phone NVARCHAR(20), email NVARCHAR(100), is_active BIT DEFAULT 1
- [ ] `leave_types` — id UNIQUEIDENTIFIER PK, name NVARCHAR(100), code NVARCHAR(20) UNIQUE, default_days DECIMAL(5,1), description NVARCHAR(MAX), is_active BIT DEFAULT 1
- [ ] `leave_balances` — id UNIQUEIDENTIFIER PK, employee_id FK, leave_type_id FK, year INT, total_days DECIMAL(5,1), used_days DECIMAL(5,1) DEFAULT 0
- [ ] `leave_requests` — id UNIQUEIDENTIFIER PK, employee_id FK, leave_type_id FK, start_date DATE, end_date DATE, total_days DECIMAL(5,1), reason NVARCHAR(MAX), status NVARCHAR(20) CHECK, approved_by UNIQUEIDENTIFIER NULL, approved_at DATETIME2 NULL, rejected_reason NVARCHAR(MAX), created_at DATETIME2 DEFAULT SYSUTCDATETIME(), updated_at DATETIME2
- [ ] `leave_config` — id UNIQUEIDENTIFIER PK, leave_type_id FK, approval_level INT CHECK(1..2), approver_role NVARCHAR(10)

### 1.3 Dapper Setup

- [ ] `Data/DbConnectionFactory.cs` — tạo `IDbConnection` từ connection string
- [ ] `Data/SqlMapperConfig.cs` — map column snake_case → PascalCase properties

### 1.4 Seed Script

- [ ] Tạo file `Data/seed.sql` — 4 departments mẫu, 1 admin QTHT, loại nghỉ phép cơ bản (Nghỉ phép năm, Ốm đau, Việc riêng)

## Delivery

- [ ] `dotnet build` thành công
- [ ] SQL script chạy được trên SQL Server instance
- [ ] Connection string hoạt động

## Files to Create

| File | Purpose |
|------|---------|
| `backend/QlnpApi/QlnpApi.csproj` | .NET 9 project |
| `backend/QlnpApi/Program.cs` | Minimal API entry |
| `backend/QlnpApi/appsettings.json` | Config |
| `backend/QlnpApi/Data/DbConnectionFactory.cs` | DB connection |
| `backend/QlnpApi/Data/schema.sql` | Full DDL |
| `backend/QlnpApi/Data/seed.sql` | Seed data |
