namespace QLNP.Api.Features.SystemConfigs;

public sealed record LeaveConfigDto(long Id, long LeaveTypeId, int ApprovalLevel, string ApproverRole);