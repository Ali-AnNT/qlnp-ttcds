namespace QLNP.Api.Features.LeaveRequests.Approve;

// No request body — action derived from current user role
internal sealed record Response(LeaveRequestDto Item);