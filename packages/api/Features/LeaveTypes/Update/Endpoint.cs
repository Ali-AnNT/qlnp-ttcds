using FastEndpoints;
using QLNP.Api.Auth;

namespace QLNP.Api.Features.LeaveTypes.Update;

internal sealed class Endpoint : Endpoint<Request, LeaveTypeDto, Mapper>
{
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure()
    {
        Put("/api/leave-types/{id}");
        Roles(AppRoles.Admin);
        Tags("Leave Types");
    }

    public override async Task HandleAsync(Request r, CancellationToken ct)
    {
        var id = Route<long>("id");
        if (r.Id != id)
        {
            AddError("ID trong URL không khớp với ID trong body");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        var leaveType = await _data.GetByIdAsync(id, ct);
        if (leaveType is null || !leaveType.IsActive)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Map.UpdateEntityAsync(r, leaveType, ct);
        await _data.SaveAsync(ct);

        var dto = new LeaveTypeDto(leaveType.Id, leaveType.Name, leaveType.Code,
            leaveType.DefaultDays, leaveType.Description, leaveType.IsActive);

        await Send.OkAsync(dto, ct);
    }
}
