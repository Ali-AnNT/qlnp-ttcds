using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.Reports.Export;

internal sealed class Data(AppDbContext db) {
    public async Task<List<LeaveRequest>> GetLeaveRequestsAsync(
        string? status, DateOnly? from, DateOnly? to, CancellationToken ct) {
        var q = db.LeaveRequests
            .Include(r => r.User)
                .ThenInclude(u => u!.DonVi)
            .Include(r => r.LeaveType)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            q = q.Where(r => r.Status == status);
        if (from.HasValue)
            q = q.Where(r => r.EndDate >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to.HasValue)
            q = q.Where(r => r.StartDate <= to.Value.ToDateTime(TimeOnly.MaxValue));

        return await q.OrderBy(r => r.StartDate).ToListAsync(ct);
    }
}
