using FastEndpoints;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveTypes.Create;

internal sealed class Mapper : Mapper<Request, LeaveTypeDto, LeaveType> {
    public override LeaveType ToEntity(Request r) => new() {
        Name = r.Name,
        Code = r.Code,
        DefaultDays = r.DefaultDays,
        Description = r.Description,
        IsActive = true
    };
}
