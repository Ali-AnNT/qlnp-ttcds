using FastEndpoints;

namespace QLNP.Api.Features.LeaveTypes.Delete;

internal sealed class Endpoint : EndpointWithoutRequest
{
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure()
    {
        Delete("/api/leave-types/{id}");
        Roles("QLNP.QTHT");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<long>("id");

        var leaveType = await _data.GetByIdAsync(id, ct);
        if (leaveType is null || !leaveType.IsActive)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        var hasRequests = await _data.HasRequestsAsync(id, ct);
        if (hasRequests)
        {
            AddError("Không thể xóa: loại nghỉ đang được sử dụng trong đơn xin nghỉ");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        leaveType.IsActive = false;
        await _data.SaveAsync(ct);

        await Send.NoContentAsync(ct);
    }
}
