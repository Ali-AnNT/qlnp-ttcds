namespace QLNP.Api.Features.LeaveRequests;

internal sealed record LeaveRequestDto(
    long Id,
    long UserId,
    string UserName,
    string DonViName,
    long LeaveTypeId,
    string LeaveTypeName,
    DateTime StartDate,
    DateTime EndDate,
    decimal TotalDays,
    string? Reason,
    string Status,
    long? RequestedApproverId,
    long? ApprovedBy,
    DateTime? ApprovedAt,
    string? RejectedReason,
    DateTime CreatedAt
);