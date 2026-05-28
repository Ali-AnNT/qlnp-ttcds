using FastEndpoints;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveRequests.Create;

internal sealed class Mapper : Mapper<Request, LeaveRequestDto, LeaveRequest> {
    public override LeaveRequest ToEntity(Request r) => new() {
        LeaveTypeId = r.LeaveTypeId,
        StartDate = r.StartDate,
        EndDate = r.EndDate,
        Reason = r.Reason,
        RequestedApproverId = r.RequestedApproverId,
        Status = "pending",
        CreatedAt = DateTime.UtcNow
    };

    public override LeaveRequestDto FromEntity(LeaveRequest e) => e.MapToDto();
}
