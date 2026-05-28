namespace QLNP.Api.Features.LeaveRequests;

internal sealed record LeaveRequestDto(
    long Id,
    long UserId,
    string UserName,
    long? DonViId,
    string DonViName,
    long LeaveTypeId,
    string LeaveTypeName,
    DateTime StartDate,
    DateTime EndDate,
    decimal TotalDays,
    string? Reason,
    string Status,
    int ApprovedLevel,
    long? RequestedApproverId,
    long? ApprovedBy,
    DateTime? ApprovedAt,
    string? RejectedReason,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
