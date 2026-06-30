using FastEndpoints;
using FluentValidation;

namespace QLNP.Api.Features.Reports.Statistics;

internal sealed class Validator : Validator<Request> {
    private static readonly string[] _validStatuses =
        ["pending", "approved", "rejected", "cancelled"];

    private static readonly string[] _validPeriods =
        ["none", "month", "quarter", "year"];

    public Validator() {
        RuleFor(x => x.Status)
            .Must(s => s is null || _validStatuses.Contains(s))
            .WithMessage("Invalid status value");

        RuleFor(x => x.Period)
            .Must(p => _validPeriods.Contains(p))
            .WithMessage("Period must be none, month, quarter, or year");

        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .When(x => x.From.HasValue && x.To.HasValue)
            .WithMessage("'to' must be >= 'from'");
    }
}
