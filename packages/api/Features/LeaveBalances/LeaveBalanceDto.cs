namespace QLNP.Api.Features.LeaveBalances;

public sealed record LeaveBalanceDto(
    long Id,
    long UserId,
    int Year,
    decimal TotalDays,
    decimal UsedDays,
    decimal RemainingDays,
    string? Role
);
