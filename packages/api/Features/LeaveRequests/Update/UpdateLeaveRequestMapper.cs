using FastEndpoints;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.LeaveRequests.Update;

internal sealed class UpdateLeaveRequestMapper : Mapper<Request, LeaveRequestDto, LeaveRequest> {
    public override LeaveRequestDto FromEntity(LeaveRequest e) => e.MapToDto();
}
