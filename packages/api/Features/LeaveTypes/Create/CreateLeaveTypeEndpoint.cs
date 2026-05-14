using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveTypes.Create;

public class CreateLeaveTypeEndpoint : Endpoint<CreateLeaveTypeRequest, CreateLeaveTypeResponse>
{
    private readonly AppDbContext _db;

    public CreateLeaveTypeEndpoint(AppDbContext db) => _db = db;

    public override void Configure()
    {
        Post("/api/leave-types");
        Roles("quantri");
    }

    public override async Task HandleAsync(CreateLeaveTypeRequest req, CancellationToken ct)
    {
        var leaveType = new LeaveType
        {
            Name = req.Name,
            Code = req.Code,
            DefaultDays = req.DefaultDays,
            Description = req.Description,
            IsActive = true
        };

        _db.LeaveTypes.Add(leaveType);
        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            AddError("Không thể tạo loại nghỉ (mã có thể đã tồn tại)");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        var dto = new LeaveTypeDto(leaveType.Id, leaveType.Name, leaveType.Code,
            leaveType.DefaultDays, leaveType.Description, leaveType.IsActive);

        await Send.CreatedAtAsync(
            $"/api/leave-types/{leaveType.Id}",
            new CreateLeaveTypeResponse(dto),
            cancellation: ct);
    }
}
