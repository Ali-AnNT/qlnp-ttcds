using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveRequests.Update;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<LeaveRequest?> GetByIdAsync(long id, CancellationToken ct) =>
        await _db.LeaveRequests
            .Include(lr => lr.User)
                .ThenInclude(u => u!.DonVi)
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == id, ct);

    public async Task<bool> HasOverlapAsync(long userId, DateTime start, DateTime end, long excludeId, CancellationToken ct) =>
        await _db.LeaveRequests
            .AnyAsync(lr =>
                lr.Id != excludeId &&
                lr.UserId == userId &&
                lr.Status == "approved" &&
                lr.StartDate <= end &&
                lr.EndDate >= start, ct);

    public async Task SaveAsync(CancellationToken ct) =>
        await _db.SaveChangesAsync(ct);
}