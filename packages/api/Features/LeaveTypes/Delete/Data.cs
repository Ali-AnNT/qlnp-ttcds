using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveTypes.Delete;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<LeaveType?> GetByIdAsync(long id, CancellationToken ct)
        => await _db.LeaveTypes.FindAsync([id], ct);

    public async Task<bool> HasRequestsAsync(long leaveTypeId, CancellationToken ct)
        => await _db.LeaveRequests.AnyAsync(r => r.LeaveTypeId == leaveTypeId, ct);

    public async Task SaveAsync(CancellationToken ct)
        => await _db.SaveChangesAsync(ct);
}
