namespace QLNP.Api.Features.LeaveRequests.Update;

internal sealed record Request(
    long LeaveTypeId,
    DateTime StartDate,
    DateTime EndDate,
    string Reason,
    long? RequestedApproverId
);
