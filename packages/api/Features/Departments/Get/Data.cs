using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.Departments.Get;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<DepartmentDto?> GetByIdAsync(long id, CancellationToken ct) =>
        await _db.DmDonvi
            .Where(d => d.DonViId == id)
            .Select(d => new DepartmentDto(d.DonViId, d.MaDonVi, d.TenDonVi, d.TenVietTat))
            .FirstOrDefaultAsync(ct);
}
