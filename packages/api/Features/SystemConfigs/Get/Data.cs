using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.SystemConfigs.Get;

internal sealed class Data {
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<List<SystemConfigDto>> GetAllAsync(CancellationToken ct) =>
        await _db.SystemConfigs
            .OrderBy(c => c.ConfigKey)
            .Select(c => new SystemConfigDto(c.Id, c.ConfigKey, c.ConfigValue, c.Description, c.UpdatedAt))
            .ToListAsync(ct);
}