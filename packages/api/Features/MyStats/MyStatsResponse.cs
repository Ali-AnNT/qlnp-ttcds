namespace QLNP.Api.Features.MyStats;

public sealed record MyStatsResponse(
    decimal RemainingDays,
    int PendingCount,
    int ApprovedCount,
    decimal UsedDays
);
