using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.Auth.Me;

internal sealed class MeEndpoint : EndpointWithoutRequest<Result<Response>> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;
    public ILeaveBalanceService BalanceService { get; set; } = null!;

    public override void Configure() {
        Get("/me");
        Group<AuthGroup>();
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var currentUser = CurrentUser.GetCurrentUser();

        var user = await Db.UserMaster.FirstOrDefaultAsync(u => u.UserMasterId == currentUser.UserId, ct);
        if (user is null) {
            await Send.NotFoundAsync(ct);
            return;
        }

        var role = MapRole(currentUser.Roles);

        // Upsert role and recalculate balance if changed
        await BalanceService.UpsertRoleAndRecalculateAsync(currentUser.UserId, role, ct);

        var response = new Response(
            UserId: user.UserMasterId,
            UserName: user.UserName,
            FullName: user.HoTen ?? currentUser.DisplayName,
            DonViId: user.DonViId ?? currentUser.UnitId,
            Role: role
        );

        await Send.OkAsync(Result<Response>.Ok(response), ct);
    }

    private static string MapRole(List<string> roles) {
        foreach (var r in AppRoles.Priority)
            if (roles.Contains(r))
                return r;
        return "user";
    }
}