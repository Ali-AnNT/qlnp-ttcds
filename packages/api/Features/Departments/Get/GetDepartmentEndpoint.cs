using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using QLNP.Api.Features.Departments;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.Departments.Get;

internal sealed class GetDepartmentEndpoint : EndpointWithoutRequest<Result<DepartmentDto>> {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Get("/{id:long}");
        Group<DepartmentGroup>();
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var id = Route<long>("id");

        var result = await Db.DmDonvi
            .Where(d => d.DonViId == id)
            .Select(d => new DepartmentDto(d.DonViId, d.MaDonVi, d.TenDonVi, d.TenVietTat))
            .FirstOrDefaultAsync(ct);

        if (result is null) {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(Result<DepartmentDto>.Ok(result), ct);
    }
}