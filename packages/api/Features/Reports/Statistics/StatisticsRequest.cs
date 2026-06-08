namespace QLNP.Api.Features.Reports.Statistics;

internal sealed record Request {
    public string? Status { get; init; }
    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }
    public string Period { get; init; } = "none";
}
