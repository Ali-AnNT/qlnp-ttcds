namespace QLNP.Api.Features.LeaveRequests.Create;

internal sealed record Request(
    long LeaveTypeId,
    DateTime StartDate,
    DateTime EndDate,
    string Reason,
    long? RequestedApproverId
);
