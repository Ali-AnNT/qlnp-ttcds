using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveRequests.List;

internal sealed class Data
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserProvider _currentUser;

    public Data(AppDbContext db, ICurrentUserProvider currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<LeaveRequestDto>> GetAsync(CancellationToken ct)
    {
        var user = _currentUser.GetCurrentUser();
        var query = _db.LeaveRequests
            .Include(lr => lr.User)
                .ThenInclude(u => u!.DonVi)
            .Include(lr => lr.LeaveType)
            .AsQueryable();

        if (user.Roles.Contains("QLNP.GD.PGD") || user.Roles.Contains("QLNP.QTHT"))
        {
            // No filter
        }
        else if (user.Roles.Contains("QLNP.LD.PCM"))
        {
            query = query.Where(lr => lr.User.PhongBanId == user.PhongBanId);
        }
        else
        {
            query = query.Where(lr => lr.UserId == user.UserId);
        }

        return await query
            .OrderByDescending(lr => lr.CreatedAt)
            .Select(lr => new LeaveRequestDto(
                lr.Id, lr.UserId, lr.User.HoTen ?? "",
                lr.User.DonVi != null ? lr.User.DonVi.TenDonVi ?? "" : "",
                lr.LeaveTypeId, lr.LeaveType.Name,
                lr.StartDate, lr.EndDate, lr.TotalDays,
                lr.Reason, lr.Status, lr.RequestedApproverId,
                lr.ApprovedBy, lr.ApprovedAt, lr.RejectedReason, lr.CreatedAt))
            .ToListAsync(ct);
    }
}