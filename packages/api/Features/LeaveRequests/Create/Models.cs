using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveRequests.Create;

internal sealed record Request(
    long LeaveTypeId,
    DateTime StartDate,
    DateTime EndDate,
    string Reason,
    long? RequestedApproverId
);

internal sealed class Validator : Validator<Request>
{
    public Validator(AppDbContext db)
    {
        RuleFor(x => x.LeaveTypeId)
            .MustAsync(async (id, ct) =>
                await db.LeaveTypes.AnyAsync(t => t.Id == id && t.IsActive, ct))
            .WithMessage("Loại nghỉ không tồn tại hoặc không còn hiệu lực");

        RuleFor(x => x.StartDate)
            .GreaterThanOrEqualTo(DateTime.Today)
            .WithMessage("Ngày bắt đầu không được là ngày quá khứ");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("Ngày kết thúc phải sau ngày bắt đầu");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Lý do không được trống")
            .MaximumLength(500);
    }
}

internal sealed record Response(LeaveRequestDto LeaveRequest);