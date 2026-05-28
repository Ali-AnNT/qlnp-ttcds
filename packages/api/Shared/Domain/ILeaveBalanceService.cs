namespace QLNP.Api.Shared.Domain;

public interface ILeaveBalanceService {
    Task RecalculateCurrentYearAsync(CancellationToken ct);
    Task RecalculateUserAsync(long userId, CancellationToken ct);
    Task UpsertRoleAndRecalculateAsync(long userId, string role, CancellationToken ct);
    Task<(decimal totalDays, string? role)> ResolveTotalDaysAsync(string? userRole, CancellationToken ct);
}
