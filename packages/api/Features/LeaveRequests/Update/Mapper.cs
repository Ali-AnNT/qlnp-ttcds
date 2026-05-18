using FastEndpoints;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveRequests.Update;

internal sealed class Mapper : Mapper<Request, Response, LeaveRequest>
{
    public override Response FromEntity(LeaveRequest e) => new(e.MapToDto());
}