namespace QLNP.Api.Features.Config;

public sealed record ConfigDto(long Id, long LeaveTypeId, int ApprovalLevel, string ApproverRole);
