namespace QLNP.Api.Features.LeaveTypes;

public record LeaveTypeDto(
    long Id,
    string Name,
    string Code,
    decimal DefaultDays,
    string? Description,
    bool IsActive
);
