---
phase: 5
title: "Update ExportReportEndpoint"
status: pending
priority: P2
effort: "30min"
dependencies: [2, 4]
---

# Phase 5: Update ExportReportEndpoint

## Overview

Update `ExportReportEndpoint.cs` to use the new `ExportDataMapper` and `ExcelBuilder` API instead of the old ClosedXML-based flow. Change from `XLWorkbook.SaveAs(stream)` to `Workbook.Save(stream, SaveFormat.Xlsx)`.

## Requirements

- Functional: Same endpoint behavior — GET `/api/reports/export` returns `.xlsx` file
- Non-functional: Response content type and filename unchanged

## Architecture

```
// BEFORE (ClosedXML)
var requests = await q.OrderBy(r => r.StartDate).ToListAsync(ct);
using var workbook = ExcelBuilder.BuildWorkbook(requests, userLookup, req.Period);
using var stream = new MemoryStream();
workbook.SaveAs(stream);

// AFTER (Aspose.Cells)
var requests = await q.OrderBy(r => r.StartDate).ToListAsync(ct);
var details = ExportDataMapper.MapDetails(requests, userLookup);
var (empLeaves, depts, summary) = ExportDataMapper.MapGrouped(requests, req.Period, userLookup);
using var workbook = ExcelBuilder.BuildWorkbook(details, empLeaves, depts, summary);
using var stream = new MemoryStream();
workbook.Save(stream, SaveFormat.Xlsx);
```

## Related Code Files

- Modify: `packages/api/Features/Reports/Export/ExportReportEndpoint.cs`

## Implementation Steps

1. **Add usings** for new types:
   ```csharp
   using Aspose.Cells;
   // Remove: using ClosedXML.Excel; (if present, likely in ExcelBuilder only)
   ```

2. **Update `HandleAsync` method** — replace the ClosedXML workbook flow:
   ```csharp
   public override async Task HandleAsync(Request req, CancellationToken ct) {
       var q = Db.LeaveRequests
           .Include(r => r.LeaveType)
           .AsQueryable();

       if (!string.IsNullOrEmpty(req.Status))
           q = q.Where(r => r.Status == req.Status);
       if (req.From.HasValue)
           q = q.Where(r => r.EndDate >= req.From.Value.ToDateTime(TimeOnly.MinValue));
       if (req.To.HasValue)
           q = q.Where(r => r.StartDate <= req.To.Value.ToDateTime(TimeOnly.MaxValue));

       var requests = await q.OrderBy(r => r.StartDate).ToListAsync(ct);

       // Load user info for Excel export
       var userInfos = await LeaveRequestUserLookup.LoadUserInfoBatchAsync(
           Db, requests.Select(r => r.UserId), ct);
       var userLookup = userInfos.ToDictionary(
           kvp => kvp.Key,
           kvp => (kvp.Value.hoTen, (string?)kvp.Value.tenDonVi));

       // Map domain data to DTOs
       var details = ExportDataMapper.MapDetails(requests, userLookup);
       var (empLeaves, depts, summary) = ExportDataMapper.MapGrouped(requests, req.Period, userLookup);

       // Build workbook from template
       using var workbook = ExcelBuilder.BuildWorkbook(details, empLeaves, depts, summary);

       using var stream = new MemoryStream();
       workbook.Save(stream, SaveFormat.Xlsx);
       stream.Position = 0;

       var fileName = $"bao-cao-nghi-phep-{DateTime.UtcNow:yyyyMMdd}.xlsx";

       await Send.StreamAsync(
           stream: stream,
           fileName: fileName,
           fileLengthBytes: stream.Length,
           contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
   }
   ```

3. **Verify** no remaining references to `XLWorkbook`, `ClosedXML`, or `IXLWorksheet` in the endpoint file

4. **Run `dotnet build`** to confirm compilation

## Success Criteria

- [ ] `ExportReportEndpoint.cs` compiles with no ClosedXML references
- [ ] `HandleAsync` method uses `ExportDataMapper.MapDetails` and `ExportDataMapper.MapGrouped`
- [ ] `workbook.Save(stream, SaveFormat.Xlsx)` replaces `workbook.SaveAs(stream)`
- [ ] Response content type, filename pattern, and stream behavior unchanged
- [ ] `dotnet build` passes

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `MemoryStream` disposal timing issue | Low | Medium | `using` blocks ensure proper disposal; stream.Position reset before Send |
| Async stream disposal before Send completes | Low | High | Verify `Send.StreamAsync` reads stream before `using` disposes it — FastEndpoints buffers by default |

## Next Steps

Proceed to Phase 6 after verifying `dotnet build` passes.