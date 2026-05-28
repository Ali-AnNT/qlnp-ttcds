---
phase: 2
title: "Data Layer"
status: pending
priority: P1
effort: "20m"
dependencies: [1]
---

# Phase 2: Data Layer

## Overview

Create `Data.cs` with LeaveRequest query. Includes User → DonVi (DmDonvi) for department name + LeaveType. Applies status + date range filters. GD.PGD sees all — no role filtering needed (endpoint `Roles()` enforces access).

## Context

- Brainstorm: [brainstorm-report](./brainstorm-report-t05-reports-export.md) → Data class snippet
- Pattern: `packages/api/Features/LeaveRequests/List/Data.cs` — existing query with includes
- Key correction: nav prop is `User.DonVi` (not `User.Department`), display field `DonVi.TenDonVi`

## Related Code Files

- Create: `packages/api/Features/Reports/Export/Data.cs`
- Reference: `packages/api/Entities/UserMaster.cs` — `DonViId` FK, `DonVi` nav prop
- Reference: `packages/api/Entities/DmDonvi.cs` — `TenDonVi` display field

## Implementation Steps

1. **Create `Data.cs`**

   ```csharp
   namespace QLNP.Api.Features.Reports.Export;

   using QLNP.Api.Data;

   internal sealed class Data(AppDbContext db)
   {
       public async Task<List<LeaveRequest>> GetLeaveRequestsAsync(
           string? status, DateOnly? from, DateOnly? to, CancellationToken ct)
       {
           var q = db.LeaveRequests
               .Include(r => r.User)
                   .ThenInclude(u => u!.DonVi)
               .Include(r => r.LeaveType)
               .AsQueryable();

           if (!string.IsNullOrEmpty(status))
               q = q.Where(r => r.Status == status);
           if (from.HasValue)
               q = q.Where(r => r.StartDate >= from.Value);
           if (to.HasValue)
               q = q.Where(r => r.EndDate <= to.Value);

           return await q.OrderBy(r => r.StartDate).ToListAsync(ct);
       }
   }
   ```

   Note: No role-based filtering — endpoint restricts to GD.PGD via `Roles()`. GD.PGD sees all requests.

2. **Verify** — check `LeaveRequest.User.DonVi.TenDonVi` resolves correctly by reviewing:
   - `UserMaster.cs`: `DonVi` nav prop exists (line 26)
   - `AppDbContext.cs`: FK config `HasOne(e => e.DonVi)` (line 84-87)

## Success Criteria

- [ ] `Data.cs` compiles with correct namespace + using
- [ ] Query includes `User.DonVi` and `LeaveType`
- [ ] Status + date range filters applied conditionally
- [ ] `dotnet build` 0 errors