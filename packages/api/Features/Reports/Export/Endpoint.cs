using FastEndpoints;
using QLNP.Api.Auth;

namespace QLNP.Api.Features.Reports.Export;

internal sealed class Endpoint : Endpoint<Request>
{
    private readonly Data _data;

    public Endpoint(Data data)
    {
        _data = data;
    }

    public override void Configure()
    {
        Get("/api/reports/export");
        Roles(AppRoles.Director);
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
            fileLengthBytes: stream.Length,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }
}