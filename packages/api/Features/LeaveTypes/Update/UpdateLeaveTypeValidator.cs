using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.Update;

public class UpdateLeaveTypeValidator : Validator<UpdateLeaveTypeRequest>
{
    public UpdateLeaveTypeValidator(AppDbContext db)
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
