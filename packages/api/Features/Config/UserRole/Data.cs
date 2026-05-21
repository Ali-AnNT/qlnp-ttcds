using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.Config.UserRole;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<UserRoleDto?> GetByUserIdAsync(long userId, CancellationToken ct)
    {
        var role = await _db.UserRoles
            .Where(r => r.UserId == userId)
            .Select(r => new UserRoleDto(r.UserId, r.Role))
            .FirstOrDefaultAsync(ct);

        return role;
    }
}
