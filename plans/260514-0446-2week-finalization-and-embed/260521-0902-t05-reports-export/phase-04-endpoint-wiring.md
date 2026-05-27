---
phase: 4
title: "Endpoint + Wiring"
status: pending
priority: P1
effort: "1h"
dependencies: [1, 2, 3]
---

# Phase 4: Endpoint + Wiring

## Overview

Create `Endpoint.cs` that ties Data + ExcelBuilder together. Register `Data` in DI. Set file download response headers. Verify full build.

## Context

- Brainstorm: [brainstorm-report](./brainstorm-report-t05-reports-export.md) → API Contract, Error Responses
- Endpoint pattern: `packages/api/Features/LeaveBalances/List/Endpoint.cs`
- DI registration: `packages/api/Program.cs` lines 64-82

## Related Code Files

- Create: `packages/api/Features/Reports/Export/Endpoint.cs`
- Modify: `packages/api/Program.cs` — register `Data` as Scoped

## Implementation Steps

1. **Create `Endpoint.cs`**

   ```csharp
   namespace QLNP.Api.Features.Reports.Export;

   using FastEndpoints;
   using QLNP.Api.Entities;

   public class ExportEndpoint : Endpoint<Request>
   {
       private readonly Data _data;

       public ExportEndpoint(Data data)
       {
           _data = data;
       }

       public override void Configure()
       {
           Get("/api/reports/export");
           Roles("QLNP.GD.PGD");
           Tags("Reports");
       }

       public override async Task HandleAsync(Request req, CancellationToken ct)
       {
           var requests = await _data.GetLeaveRequestsAsync(
               req.Status, req.From, req.To, ct);

           using var workbook = ExcelBuilder.BuildWorkbook(requests, req.Period);

           using var stream = new MemoryStream();
           workbook.SaveAs(stream);
           stream.Position = 0;

           var fileName = $"bao-cao-nghi-phep-{DateTime.UtcNow:yyyyMMdd}.xlsx";

           await Send.StreamAsync(
               stream: stream,
               fileName: fileName,
               contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
       }
   }
   ```

   Notes:
   - `Endpoint<Request>` (no TResponse) — raw file response, not JSON
   - `Roles("QLNP.GD.PGD")` — strictly GD.PGD only per BRD
   - `MemoryStream` + `SaveAs` + `Send.StreamAsync` — FastEndpoints-native file response method (auto-sets Content-Disposition)

2. **Register Data in `Program.cs`**

   Add alongside existing Data registrations (around line 82):
   ```csharp
   builder.Services.AddScoped<QLNP.Api.Features.Reports.Export.Data>();
   ```

3. **Build verify**
   ```bash
   cd packages/api && dotnet build
   ```

4. **Manual smoke test** (if dev server running)
   - Call `GET /api/reports/export` with GD.PGD token → expect .xlsx download
   - Call with CB.PCM token → expect 403
   - Call with `?period=month` → expect 4-sheet .xlsx
   - Call with `?period=none` → expect 1-sheet .xlsx
   - Call with no matching data → expect valid .xlsx with headers only

## Success Criteria

- [ ] `Endpoint.cs` compiles with correct route + role
- [ ] `Data` registered in `Program.cs`
- [ ] `dotnet build` 0 errors
- [ ] GD.PGD → 200 + `.xlsx` with correct Content-Type
- [ ] Non-GD.PGD → 403
- [ ] `Content-Disposition: attachment; filename="bao-cao-nghi-phep-*.xlsx"`
- [ ] File opens in Excel without errors