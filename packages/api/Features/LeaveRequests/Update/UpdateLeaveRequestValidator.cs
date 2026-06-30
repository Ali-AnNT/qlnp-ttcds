using FastEndpoints;
using FluentValidation;

namespace QLNP.Api.Features.LeaveRequests.Update;

internal sealed class Validator : Validator<Request> {
    public Validator() {
        RuleFor(x => x.StartDate)
            .GreaterThanOrEqualTo(_ => DateTime.Today)
            .WithMessage("Ngày bắt đầu không được là ngày quá khứ");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("Ngày kết thúc phải sau ngày bắt đầu");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Lý do không được trống")
            .MaximumLength(500);
    }
}
