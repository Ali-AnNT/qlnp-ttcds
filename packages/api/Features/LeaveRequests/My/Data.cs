using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveRequests.My;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<List<LeaveRequestDto>> GetByUserIdAsync(long userId, CancellationToken ct) =>
        await _db.LeaveRequests
            .Include(lr => lr.User).ThenInclude(u => u!.DonVi)
            .Include(lr => lr.LeaveType)
            .Where(lr => lr.UserId == userId)
            .OrderByDescending(lr => lr.CreatedAt)
            .Select(lr => new LeaveRequestDto(
                lr.Id, lr.UserId, lr.User.HoTen ?? "",
                lr.User.DonViId,
                lr.User.DonVi != null ? lr.User.DonVi.TenDonVi ?? "" : "",
                lr.LeaveTypeId, lr.LeaveType.Name,
                lr.StartDate, lr.EndDate, lr.TotalDays,
                lr.Reason, lr.Status, lr.RequestedApproverId,
                lr.ApprovedBy, lr.ApprovedAt, lr.RejectedReason, lr.CreatedAt, lr.UpdatedAt))
            .ToListAsync(ct);
}
