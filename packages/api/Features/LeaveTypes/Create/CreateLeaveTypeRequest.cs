namespace QLNP.Api.Features.LeaveTypes.Create;

internal sealed record Request(string Name, string Code, decimal DefaultDays, string? Description);
