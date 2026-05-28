using FastEndpoints;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveTypes.Update;

internal sealed class Mapper : Mapper<Request, LeaveTypeDto, LeaveType> {
    public override Task<LeaveType> UpdateEntityAsync(Request r, LeaveType e, CancellationToken ct) {
        e.Name = r.Name;
        e.Code = r.Code;
        e.DefaultDays = r.DefaultDays;
        e.Description = r.Description;
        e.IsActive = r.IsActive;
        return Task.FromResult(e);
    }
}
