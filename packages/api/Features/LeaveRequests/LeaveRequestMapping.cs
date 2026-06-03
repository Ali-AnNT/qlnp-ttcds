using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.LeaveRequests;

internal static class LeaveRequestMapping {
    /// <summary>
    /// Maps LeaveRequest entity to DTO with user info loaded separately via UserPortalId lookup.
    /// </summary>
    internal static LeaveRequestDto MapToDto(
        this LeaveRequest e,
        string hoTen = "",
        long? donViId = null,
        string tenDonVi = "",
        bool canCurrentUserApprove = true) => new(
        e.Id, e.UserId, hoTen,
        donViId,
        tenDonVi,
        e.LeaveTypeId, e.LeaveType?.Name ?? "",
        e.StartDate, e.EndDate, e.TotalDays,
        e.Reason, e.Status, e.ApprovedLevel, e.RequestedApproverId,
        e.ApprovedBy, e.ApprovedAt, e.RejectedReason, e.CreatedAt, e.UpdatedAt,
        canCurrentUserApprove
    );
}
