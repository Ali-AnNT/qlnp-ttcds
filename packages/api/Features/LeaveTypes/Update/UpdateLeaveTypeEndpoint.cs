using FastEndpoints;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.Update;

public class UpdateLeaveTypeEndpoint : Endpoint<UpdateLeaveTypeRequest, UpdateLeaveTypeResponse>
{
    private readonly AppDbContext _db;

    public UpdateLeaveTypeEndpoint(AppDbContext db) => _db = db;

    public override void Configure()
    {
        Put("/api/leave-types/{id}");
        Roles("quantri");
    }

    public override async Task HandleAsync(UpdateLeaveTypeRequest req, CancellationToken ct)
    {
        var id = Route<long>("id");
        if (req.Id != id)
        {
            AddError("ID trong URL không khớp với ID trong body");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var leaveType = await _db.LeaveTypes.FindAsync([id], ct);
        if (leaveType is null || !leaveType.IsActive)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        leaveType.Name = req.Name;
        leaveType.Code = req.Code;
        leaveType.DefaultDays = req.DefaultDays;
        leaveType.Description = req.Description;
        leaveType.IsActive = req.IsActive;

        await _db.SaveChangesAsync(ct);

        var dto = new LeaveTypeDto(leaveType.Id, leaveType.Name, leaveType.Code,
            leaveType.DefaultDays, leaveType.Description, leaveType.IsActive);

        await Send.OkAsync(new UpdateLeaveTypeResponse(dto), ct);
    }
}
