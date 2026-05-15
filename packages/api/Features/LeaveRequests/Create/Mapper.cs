using FastEndpoints;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveRequests.Create;

internal sealed class Mapper : Mapper<Request, Response, LeaveRequest>
{
    public override LeaveRequest ToEntity(Request r) => new()
    {
        LeaveTypeId = r.LeaveTypeId,
        StartDate = r.StartDate,
        EndDate = r.EndDate,
        Reason = r.Reason,
        RequestedApproverId = r.RequestedApproverId,
        Status = "pending",
        CreatedAt = DateTime.UtcNow
    };

    public override Response FromEntity(LeaveRequest e) => new(MapToDto(e));

    internal LeaveRequestDto MapToDto(LeaveRequest e) => new(
        e.Id, e.UserId, e.User?.HoTen ?? "",
        e.User?.DonVi?.TenDonVi ?? "",
        e.LeaveTypeId, e.LeaveType?.Name ?? "",
        e.StartDate, e.EndDate, e.TotalDays,
        e.Reason, e.Status, e.RequestedApproverId,
        e.ApprovedBy, e.ApprovedAt, e.RejectedReason, e.CreatedAt
    );
}