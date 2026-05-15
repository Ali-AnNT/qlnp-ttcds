using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveTypes.Create;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<LeaveType> CreateAsync(LeaveType entity, CancellationToken ct)
    {
        _db.LeaveTypes.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }
}
