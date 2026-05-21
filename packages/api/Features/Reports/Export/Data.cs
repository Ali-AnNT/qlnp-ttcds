namespace QLNP.Api.Features.Reports.Export;

using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

internal sealed class Data(AppDbContext db)
{
    public async Task<List<Entities.LeaveRequest>> GetLeaveRequestsAsync(
        string? status, DateOnly? from, DateOnly? to, CancellationToken ct)
    {
        var q = db.LeaveRequests
            .Include(r => r.User)
                .ThenInclude(u => u!.DonVi)
            .Include(r => r.LeaveType)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            q = q.Where(r => r.Status == status);
        if (from.HasValue)
            q = q.Where(r => r.StartDate >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to.HasValue)
            q = q.Where(r => r.EndDate <= to.Value.ToDateTime(TimeOnly.MinValue));

        return await q.OrderBy(r => r.StartDate).ToListAsync(ct);
    }
}
