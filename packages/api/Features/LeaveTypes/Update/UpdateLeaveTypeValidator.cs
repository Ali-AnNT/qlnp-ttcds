using FastEndpoints;
using FluentValidation;

namespace QLNP.Api.Features.LeaveTypes.Update;

internal sealed class Validator : Validator<Request> {
    public Validator() {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên loại nghỉ không được trống")
            .MaximumLength(100);

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã loại nghỉ không được trống")
            .MaximumLength(20);

        RuleFor(x => x.DefaultDays)
            .GreaterThan(0).WithMessage("Số ngày mặc định phải lớn hơn 0");
    }
}
