namespace QLNP.Api.Features.Reports.Export;

using FastEndpoints;

internal sealed class Endpoint(Data data) : Endpoint<Request>
{
    public override void Configure()
    {
        Get("/api/reports/export");
        Roles("QLNP.GD.PGD");
        Tags("Reports");
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var requests = await data.GetLeaveRequestsAsync(
            req.Status, req.From, req.To, ct);

        using var workbook = ExcelBuilder.BuildWorkbook(requests, req.Period);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        var fileName = $"bao-cao-nghi-phep-{DateTime.UtcNow:yyyyMMdd}.xlsx";

        await Send.StreamAsync(
            stream: stream,
            fileName: fileName,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            cancellation: ct);
    }
}
