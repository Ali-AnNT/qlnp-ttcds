using FastEndpoints;
using FluentValidation;

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