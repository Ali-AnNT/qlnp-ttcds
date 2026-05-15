using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.Update;

internal sealed record Request(long Id, string Name, string Code, decimal DefaultDays, string? Description, bool IsActive);

internal sealed class Validator : Validator<Request>
{
    public Validator(AppDbContext db)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên loại nghỉ không được trống")
            .MaximumLength(100);

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã loại nghỉ không được trống")
            .MaximumLength(20)
            .MustAsync(async (req, code, ct) =>
                !await db.LeaveTypes.AnyAsync(t => t.Code == code && t.Id != req.Id && t.IsActive, ct))
            .WithMessage("Mã loại nghỉ đã tồn tại");

        RuleFor(x => x.DefaultDays)
            .GreaterThan(0).WithMessage("Số ngày mặc định phải lớn hơn 0");
    }
}

internal sealed record Response(LeaveTypeDto LeaveType);
