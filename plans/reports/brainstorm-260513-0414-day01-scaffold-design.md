# Brainstorm Report: Day-01 Scaffold Design

**Date:** 2026-05-13 | **Branch:** rebuid-bundle

## Decision Summary

| Item | Decision |
|------|----------|
| Project path | `packages/api/` (monorepo) |
| Project name | `QLNP.Api` |
| Framework | FastEndpoints + Vertical Slice Architecture |
| ORM | Dapper |
| DB | SQL Server (UNIQUEIDENTIFIER PKs) |
| Auth | JWT dual-issuer (HS256 + RS256), BCrypt |
| Schema file | `Data/schema.sql` |
| .NET version | 9.0 (cài mới) |
| Connection string | Placeholder trong appsettings.json |

## Project Structure

```
packages/api/
├── QLNP.Api.csproj
├── Program.cs                        (FastEndpoints registration)
├── appsettings.json                  (conn string + JWT settings)
├── appsettings.Development.json
├── Features/
│   ├── Auth/{Login,Exchange,Me}/
│   ├── Employees/{List,Create,Update,Delete}/
│   ├── Departments/{List,Create,Update,Delete}/
│   ├── LeaveTypes/{List,Create,Update,Delete}/
│   ├── LeaveRequests/{List,Create,Update,Approve,Reject,Cancel}/
│   ├── LeaveBalances/{List,My}/
│   └── Config/{Get,Update}/
├── Data/
│   ├── DbConnectionFactory.cs
│   ├── SqlMapperConfig.cs
│   ├── schema.sql
│   └── seed.sql
└── Middleware/
```

## Scope: Day-01

- Scaffold project structure
- 6 table DDL (departments, employees, leave_types, leave_balances, leave_requests, leave_config)
- Dapper factory + snake_case mapping
- Seed data (4 depts, 1 admin, 3 leave types)
- **NO endpoints** (day 2+)

## NuGet Packages

FastEndpoints, Dapper, Microsoft.Data.SqlClient, BCrypt.Net-Next, System.IdentityModel.Tokens.Jwt

## Delivery Criteria

- `dotnet build` successful
- schema.sql + seed.sql ready
- Update day-01 plan file (Minimal API → FastEndpoints + VSA)

## Next

Proceed to implementation (/ck:cook).
