using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace QLNP.Api.Features.LeaveTypes.Create;

internal sealed class Endpoint : Endpoint<Request, LeaveTypeDto, Mapper>
{
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure()
    {
        Post("/api/leave-types");
        Roles("QLNP.QTHT");
        Tags("Leave Types");
    }

    public override async Task HandleAsync(Request r, CancellationToken ct)
    {
        var entity = Map.ToEntity(r);

        try
        {
            await _data.CreateAsync(entity, ct);
        }
        catch (DbUpdateException)
        {
            AddError("Không thể tạo loại nghỉ (mã có thể đã tồn tại)");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        var dto = new LeaveTypeDto(entity.Id, entity.Name, entity.Code,
            entity.DefaultDays, entity.Description, entity.IsActive);

        await Send.CreatedAtAsync(
            $"/api/leave-types/{entity.Id}",
            dto,
            cancellation: ct);
    }
}
