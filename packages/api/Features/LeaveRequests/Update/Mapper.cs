using FastEndpoints;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveRequests.Update;

internal sealed class Mapper : Mapper<Request, LeaveRequestDto, LeaveRequest>
{
    public override LeaveRequestDto FromEntity(LeaveRequest e) => e.MapToDto();
}
