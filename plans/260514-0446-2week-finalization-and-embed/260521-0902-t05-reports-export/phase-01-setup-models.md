---
phase: 1
title: "Setup + Models"
status: pending
priority: P1
effort: "30m"
dependencies: []
---

# Phase 1: Setup + Models

## Overview

Add ClosedXML NuGet package. Create `Models.cs` with Request record, FluentValidation rules, and status-to-Vietnamese mapping.

## Context

- Brainstorm: [brainstorm-report](./brainstorm-report-t05-reports-export.md) → API Contract, Locked Decisions
- csproj: `packages/api/QLNP.Api.csproj`
- Validator pattern: see `packages/api/Features/LeaveRequests/Create/Models.cs`

## Related Code Files

- Modify: `packages/api/QLNP.Api.csproj` — add ClosedXML package
- Create: `packages/api/Features/Reports/Export/Models.cs`

## Implementation Steps

1. **Add ClosedXML NuGet**
   ```bash
   cd packages/api && dotnet add package ClosedXML
   ```
   Verify version in csproj. Latest stable expected ~0.104.x. Targets netstandard2.0 — compatible with net10.0.

2. **Create `Models.cs`**

   ```csharp
   namespace QLNP.Api.Features.Reports.Export;

   internal sealed record Request
   {
       public string? Status { get; init; }
       public DateOnly? From { get; init; }
       public DateOnly? To { get; init; }
       public string Period { get; init; } = "none";
   }

   internal sealed class Validator : Validator<Request>
   {
       private static readonly string[] ValidStatuses =
           ["pending", "approved_leader", "approved_director", "rejected", "cancelled"];
       private static readonly string[] ValidPeriods =
           ["none", "month", "quarter", "year"];

       public Validator()
       {
           RuleFor(x => x.Status)
               .Must(s => s is null || ValidStatuses.Contains(s))
               .WithMessage("Invalid status value");

           RuleFor(x => x.Period)
               .Must(p => ValidPeriods.Contains(p))
               .WithMessage("Period must be none, month, quarter, or year");

           RuleFor(x => x.To)
               .GreaterThanOrEqualTo(x => x.From)
               .When(x => x.From.HasValue && x.To.HasValue)
               .WithMessage("'to' must be >= 'from'");
       }
   }

   internal static class StatusLabels
   {
       private static readonly Dictionary<string, string> Map = new()
       {
           ["pending"] = "Chờ duyệt",
           ["approved_leader"] = "Đã duyệt LĐ",
           ["approved_director"] = "Đã duyệt GĐ",
           ["rejected"] = "Từ chối",
           ["cancelled"] = "Đã hủy"
       };

       public static string ToVietnamese(string status)
           => Map.GetValueOrDefault(status, status);
   }
   ```

3. **Run `dotnet build`** to verify package restore + compile.

## Success Criteria

- [ ] ClosedXML in csproj `<PackageReference>`
- [ ] `dotnet build` 0 errors
- [ ] `Request` record with 4 fields + `Validator` with 3 rules
- [ ] `StatusLabels.ToVietnamese()` maps all 5 statuses