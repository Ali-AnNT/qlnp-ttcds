namespace QLNP.Api.Features.LeaveBalances;

public sealed record LeaveBalanceDto(
    long Id,
    long UserId,
    long LeaveTypeId,
    string? LeaveTypeName,
    int Year,
    decimal TotalDays,
    decimal UsedDays,
    decimal RemainingDays
);
