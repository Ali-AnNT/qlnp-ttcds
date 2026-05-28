using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.SystemConfigs.Update;

internal sealed class Data {
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task ReplaceAllAsync(IReadOnlyList<SystemConfigDto> items, CancellationToken ct) {
        _db.SystemConfigs.RemoveRange(await _db.SystemConfigs.ToListAsync(ct));

        foreach (var item in items) {
            _db.SystemConfigs.Add(new SystemConfig {
                ConfigKey = item.ConfigKey,
                ConfigValue = item.ConfigValue,
                Description = item.Description,
                UpdatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync(ct);
    }
}