using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using QLNP.Api.Features.Departments;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.Departments.List;

internal sealed class ListDepartmentsEndpoint : EndpointWithoutRequest<Result<List<DepartmentDto>>> {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Get("");
        Group<DepartmentGroup>();
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var items = await Db.DmDonvi
            .OrderBy(d => d.TenDonVi)
            .Select(d => new DepartmentDto(d.DonViId, d.MaDonVi, d.TenDonVi, d.TenVietTat))
            .ToListAsync(ct);

        await Send.OkAsync(Result<List<DepartmentDto>>.Ok(items), ct);
    }
}