using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.Config.Update;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task ReplaceAllAsync(IReadOnlyList<ConfigDto> items, CancellationToken ct)
    {
        _db.LeaveConfigs.RemoveRange(await _db.LeaveConfigs.ToListAsync(ct));

        foreach (var item in items)
        {
            _db.LeaveConfigs.Add(new LeaveConfig
            {
                LeaveTypeId = item.LeaveTypeId,
                ApprovalLevel = item.ApprovalLevel,
                ApproverRole = item.ApproverRole
            });
        }

        await _db.SaveChangesAsync(ct);
    }
}
