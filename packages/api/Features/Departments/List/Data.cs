using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.Departments.List;

internal sealed class Data {
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<List<DepartmentDto>> GetAllAsync(CancellationToken ct) =>
        await _db.DmDonvi
            .OrderBy(d => d.TenDonVi)
            .Select(d => new DepartmentDto(d.DonViId, d.MaDonVi, d.TenDonVi, d.TenVietTat))
            .ToListAsync(ct);
}
