namespace QLNP.Api.Features.LeaveTypes.List;

internal sealed record Response(IReadOnlyList<LeaveTypeDto> Items);
