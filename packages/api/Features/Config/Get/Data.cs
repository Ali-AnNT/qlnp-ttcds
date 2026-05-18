using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.Config.Get;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<List<ConfigDto>> GetAllAsync(CancellationToken ct) =>
        await _db.LeaveConfigs
            .Select(c => new ConfigDto(c.Id, c.LeaveTypeId, c.ApprovalLevel, c.ApproverRole))
            .ToListAsync(ct);
}
