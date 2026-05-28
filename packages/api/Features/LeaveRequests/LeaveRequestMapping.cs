using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveRequests;

internal static class LeaveRequestMapping {
    internal static LeaveRequestDto MapToDto(this LeaveRequest e) => new(
        e.Id, e.UserId, e.User?.HoTen ?? "",
        e.User?.DonViId,
        e.User?.DonVi?.TenDonVi ?? "",
        e.LeaveTypeId, e.LeaveType?.Name ?? "",
        e.StartDate, e.EndDate, e.TotalDays,
        e.Reason, e.Status, e.ApprovedLevel, e.RequestedApproverId,
        e.ApprovedBy, e.ApprovedAt, e.RejectedReason, e.CreatedAt, e.UpdatedAt
    );
}
