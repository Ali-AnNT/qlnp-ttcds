---
day: 1
title: API Scaffold and EF Core Setup
status: completed
priority: P0
effort: 0.5 day
date: 2026-05-13
---

# Day 1: API Scaffold and EF Core Setup

## Context Links

- `plans/260513-0221-dotnet-migration-refactor/plan.md`
- `packages/api/QLNP.Api.csproj`
- `packages/api/Program.cs`

## Overview

Created .NET 9 API foundation with FastEndpoints and EF Core SQL Server. This replaces the old Dapper direction.

## Key Insights

- Use `packages/api`, not `backend/`.
- Keep VSA folders under `packages/api/Features`.
- Use `AppDbContext` directly in endpoints. No repository layer yet.

## Requirements

- API targets `net9.0`.
- FastEndpoints registered in DI and pipeline.
- EF Core SQL Server configured from `DefaultConnection`.

## Architecture

React web calls `/api/*` -> FastEndpoints -> `AppDbContext` -> SQL Server.

## Related Code Files

| Action | File |
|--------|------|
| Created | `packages/api/QLNP.Api.csproj` |
| Created | `packages/api/Program.cs` |
| Created | `packages/api/appsettings.json` |
| Created | `packages/api/appsettings.Development.json` |

## Implementation Steps

1. Create .NET 9 web project in `packages/api`.
2. Add FastEndpoints and EF Core SQL Server packages.
3. Register `AddFastEndpoints()`.
4. Register `AddDbContext<AppDbContext>()`.
5. Add middleware and `UseFastEndpoints()`.

## Todo List

- [x] API project exists.
- [x] EF Core packages installed.
- [x] FastEndpoints wired.
- [x] Config files created.

## Success Criteria

- `dotnet build packages/api/QLNP.Api.csproj` compiles.
- API starts with current `Program.cs`.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Package version drift | Pin EF Core to 9.0.0 and FastEndpoints to 8.1.0 |

## Security Considerations

- Do not commit real DB credentials in appsettings.

## Next Steps

- Scaffold system tables and create `AppDbContext`.
