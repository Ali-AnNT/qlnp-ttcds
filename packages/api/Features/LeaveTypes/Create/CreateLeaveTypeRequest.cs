namespace QLNP.Api.Features.LeaveTypes.Create;

public record CreateLeaveTypeRequest(
    string Name,
    string Code,
    decimal DefaultDays,
    string? Description
);
