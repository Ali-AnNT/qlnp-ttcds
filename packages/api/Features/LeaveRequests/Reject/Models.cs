using FastEndpoints;
using FluentValidation;

namespace QLNP.Api.Features.LeaveRequests.Reject;

internal sealed record Request(string RejectedReason);

internal sealed class Validator : Validator<Request> {
    public Validator() {
        RuleFor(x => x.RejectedReason)
            .NotEmpty().WithMessage("Phải nhập lý do từ chối");
    }
}
