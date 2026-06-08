using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Shared.Domain;
using QLNP.Api.Features.LeaveRequests;
using Aspose.Cells;

namespace QLNP.Api.Features.Reports.Export;

internal sealed class ExportReportEndpoint : Endpoint<Request> {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Get("/api/reports/export");
        Roles(AppRoles.Director);
        Tags("Reports");
    }

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
}
