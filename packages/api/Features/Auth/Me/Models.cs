namespace QLNP.Api.Features.Auth.Me;

internal sealed record Response(
    long Id,
    string DisplayName,
    long UnitId,
    long PhongBanId,
    List<string> Roles,
    int UserIdUBTP,
    int PhongBanIdUBTP,
    int DonViIdUBTP
);
