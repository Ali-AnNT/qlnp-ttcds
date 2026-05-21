using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.Create;

internal sealed record Request(string Name, string Code, decimal DefaultDays, string? Description);

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
            .MustAsync(async (code, ct) =>
                !await db.LeaveTypes.AnyAsync(t => t.Code == code, ct))
            .WithMessage("Mã loại nghỉ đã tồn tại");

        RuleFor(x => x.DefaultDays)
            .GreaterThan(0).WithMessage("Số ngày mặc định phải lớn hơn 0");
    }
}

// Response is LeaveTypeDto directly
