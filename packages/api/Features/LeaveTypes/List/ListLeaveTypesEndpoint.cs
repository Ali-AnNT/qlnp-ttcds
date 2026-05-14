using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.List;

public class ListLeaveTypesEndpoint : EndpointWithoutRequest<ListLeaveTypesResponse>
{
    private readonly AppDbContext _db;

    public ListLeaveTypesEndpoint(AppDbContext db) => _db = db;

    public override void Configure()
    {
        Get("/api/leave-types");
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var items = await _db.LeaveTypes
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .Select(t => new LeaveTypeDto(t.Id, t.Name, t.Code, t.DefaultDays, t.Description, t.IsActive))
            .ToListAsync(ct);

        await Send.OkAsync(new ListLeaveTypesResponse(items), ct);
    }
}
