namespace QLNP.Api.Features.LeaveTypes.Update;

public record UpdateLeaveTypeRequest(
    long Id,
    string Name,
    string Code,
    decimal DefaultDays,
    string? Description,
    bool IsActive
);
