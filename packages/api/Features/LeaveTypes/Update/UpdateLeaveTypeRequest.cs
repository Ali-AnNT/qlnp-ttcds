namespace QLNP.Api.Features.LeaveTypes.Update;

internal sealed record Request(long Id, string Name, string Code, decimal DefaultDays, string? Description, bool IsActive);
